const Schemer = (() => {


  const { getChroma, getContrast, getColorPack } = Exports.ColorWords
  const chroma = getChroma()

  const white = '#ffffff'
  const black = '#000000'

  //see if avalues  is a hex code - naive test
  const isHex = (value) => value && value.toString().match(/^#[0-9abcdef]+$/i)

  const getDistance = (a, b, name) =>
    name === 'deltaE' ? chroma.deltaE(a, b) : chroma.distance(a, b, name)

  const normalDistance = (a, b, mode) => getDistance(a, b, mode.name) / mode.top

  // find the closest match
  const getClosest = (refSet, target, mode) => refSet.reduce((closest, ref) => {
    const distance = normalDistance(target, ref.color, mode)
    return distance < closest.distance ? {
      ...closest,
      distance,
      ref
    } : closest

  }, { target, mode: mode, distance: Infinity, ref: null })


  const modeList = ['cmyk', 'hcl', 'hsl', 'hsv', 'lab', 'lch', 'oklab', 'oklch', 'rgb', 'deltaE']

  // we dont really know the ranges of all these modes, so just doa difference between white and blackand use that
  const modes = modeList.map(name => {
    return {
      name,
      top: getDistance(white, black, name)
    }
  })

  const setBest = (closest, p) => {
    if (closest.distance < p['best-distance']) {
      p['best-match'] = closest.ref.color.hex()
      p['best-name'] = closest.ref.name
      p['best-mode'] = closest.mode.name
      p['best-distance'] = closest.distance
    }
    return p
  }

  const getRangeList = (fiddler, columns, rowOffset) => {
    return fiddler.getRangeList(columns, {
      rowOffset
    })

  }
  const populate = ({
    scheme,
    match,
    analysis
  }) => {

    // check input columns exist and organize data
    const [schemeColors, matchColors, analysisColors] = [scheme, match, analysis].map(f => {
      const data = f.fiddler.getData()
      const codeColumn = f.code && f.fiddler.getHeaders().indexOf(f.code)
      const nameColumn = f.name && f.fiddler.getHeaders().indexOf(f.name)
      if (codeColumn === -1) {
        throw `${f.code} not found in sheet ${f.fiddler.getSheet().getName()}`
      }
      if (f.name && nameColumn === -1) {
        throw `${f.name} not found in sheet ${f.fiddler.getSheet().getName()}`
      }
      // convert to chroma
      const targets = !f.code ? [] : data.map(d => {
        try {
          return {
            color: chroma(d[f.code]),
            name: d[f.name]
          }
        }
        catch (err) {
          throw `couldnt convert color ${d[f.code]} in column ${f.code} on sheet ${f.fiddler.getSheet().getName()}`
        }
      })

      // we'll set preferred format which willbe applied if caller chooses to dump
      const headColor = getColorPack('black')
      f.fiddler.setHeaderFormat({
        wraps: true,
        backgrounds: headColor.hex,
        fontWeights: 'bold',
        fontColors: headColor.contrast
      })

      return {
        ...f,
        codeColumn,
        nameColumn,
        targets,
        data
      }
    })

    const result = matchColors.targets.map(({ color, name }, i) => {
      return modes.reduce((p, mode) => {
        const closest = getClosest(schemeColors.targets, color, mode)
        p[`${mode.name}-ref name`] = closest.ref.name
        p[`${mode.name}-ref color`] = closest.ref.color.hex()
        p[`${mode.name}-distance`] = closest.distance
        return setBest(closest, p)
      }, {
        target: color.hex(),
        'best-match': '',
        'most-votes': '',
        'best-name': '',
        'best-mode': '',
        'best-distance': Infinity,
        consensus: 0
      })
    })

    // see how many timesweagree acrosscolor spaces
    // and find votewinnder
    // reduce precision also on the distance
    result.forEach(p => {

      Object.keys(p).filter (f=> f.indexOf('distance') !==-1).forEach(f=>p[f] = p[f].toFixed(3))
      const colorCols = Object.keys(p).filter(f => f.indexOf("-ref color") !== -1)
      p.consensus = colorCols.filter(f => p[f] === p['best-match']).length / colorCols.length

      // now get the winner by votes
      const m = new Map(colorCols.map(f => [p[f], {
        count: 0,
        color: p[f]
      }]))

      colorCols.forEach(f => {
        m.get(p[f]).count++
      })
      const winner = Array.from(m.values()).sort((a, b) => b.count - a.count)
      p['most-votes'] = winner[0].color

    })

    // set the analysis result
    analysis.fiddler.setData(result)

    // these closures will allow colorization of the thing
    const colorize = (fiddler) => {
      const backgrounds = fiddler.getData().map(row => {
        return fiddler.getHeaders().map(col => isHex(row[col]) ? row[col] : null)
      })
      const fontColors = backgrounds.map(row => {
        return row.map(col => isHex(col) ? getContrast(col) : null)
      })
      const range = fiddler.getRange()
        .offset(1, 0, backgrounds.length, backgrounds[0].length)

      range
        .setBackgrounds(backgrounds)
        .setFontColors(fontColors)

      return {
        range,
        backgrounds,
        fontColors
      }
    }



    return {
      colorizeAnalysis: () => colorize(analysis.fiddler),
      colorizeScheme: () => colorize (scheme.fiddler),
      colorizeMatch: () => colorize (match.fiddler),
      analysis,
      scheme,
      match,
      result
    }

  }


  return {
    populate,
    getDistance,
    isHex
  }

})()

