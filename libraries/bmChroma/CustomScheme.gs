class CustomScheme {

  /**
   * a scheme looks like this
   * if there are variants then there must be a base specified
   * with no variants, you can just specify a string
   * {
   *   red: {
          base: '#f44336',
          variants: {
            "lighten-5": '#ffebee',
            .... etc
          }
   *   },
   *   purple: '#9c27b0',
   *   ....etc 
   * }
   */

  constructor({ name, scheme } = {}) {
    this.name = name
    const keys = ['variants', 'base']

    // check that the color makes sense (hex or name like 'red')
    const validateColor = (color) => {
      const cp = Exports.ColorWords.getColorPack(color)
      if (!cp.hex) throw `custom scheme ${name}:${color} is not a color`
      return cp
    }

    if (!name) {
      throw 'custom scheme must have a name - args are {name, scheme}'
    }
    
    // validate the scheme
    if (typeof scheme !== 'object') {
      throw `custom scheme ${name} must be an object - args are {name, scheme}`
    }

    this._scheme = Object.freeze(Reflect.ownKeys(scheme))
      .reduce((s, color) => {
        const ob = scheme[color]
        if (s[color]) throw `custom scheme ${name}:${color} is a duplicate`
        s[color] = {}
        if (typeof ob === 'string') {
          s[color].base = validateColor(ob).hex
        } else if (typeof ob === 'object') {
          
          if (Reflect.ownKeys(ob).some(f => keys.indexOf(f) === -1)) {
            throw `custom scheme ${name}:${color} has invalid keys - only ${keys.join(",")} are allowed`
          }

          if (!Reflect.has(ob, 'base')) {
            throw `custom scheme ${name}:${color} must have a base color`
          } else {
            s[color].base = validateColor(ob.base).hex
            if (Reflect.has(ob, 'variants')) {
              
              s[color].variants = Reflect.ownKeys(ob.variants)
                .reduce((p,c) => {
                  if (p[c]) {
                    throw `custom scheme ${name}:${color}:${c} is a duplicate variant`
                  }
                  p[c] = validateColor(ob.variants[c])
                  return p
                }, {})

            }
          }
          
        }
        return s
      }, {})

  }

  get scheme () {
    return this._scheme
  }


  listScheme() {
    const mdf = this.scheme

    // standarize the color name
    return Reflect.ownKeys(mdf).reduce((p, c) => {
      // c would be something like red
      const ob = mdf[c]
      if (!ob.base) throw `couldnt find base for ${name}: ${c}`
      p.push({
        "color name": c,
        hex: ob.base
      })
      // add any variants
      if (Reflect.has(ob, 'variants')) {
        Reflect.ownKeys(ob.variants).forEach(f => {
          const vob = ob.variants[f]
          p.push({
            "color name": c + '-' + f,
            hex: vob.hex
          })
        })
      }
      return p
    }, [])
  }


}

