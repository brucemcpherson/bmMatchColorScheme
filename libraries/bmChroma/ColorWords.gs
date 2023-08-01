/**
 * @typedef ColorNames
 * @property {string} text the original text
 * @property {string[]} colorNames the words in the string that could be colors
 */

/**
 * @typedef ColorNames
 * @property {string} text the original text
 * @property {string[]} colorNames the words in the string that could be colors
 */

/**
 * @typedef ColorPack
 * @property {object} base a chorma color
 * @property {string} hex version of the based (same as base.hex())
 * @property {string} contrast the contrast color in hex
 * @property {string} name the name of the color (or a hex code if it cant be named)
 */

/**
 * @typedef TextToColors
 * @property {string} text the original text 
 * @property [string[]} colorNames an array of picked color names
 * @property {ColorPack[]} colorPacks an array of colorpacks with detailed info about each color
 */
const ColorWords = (() => {

  const DARK = "#000000"
  const LIGHT = '#ffffff'
  const MIN_LUMINANCE = 0.5

  /**
   * find all the words in a sentence that could be colors
   * @param {string} text some trext that may or may not contain recognizable color names
   * @return {ColorNames} a string array of colorNames and the original text 
   */
  const discover = (text) => ({
    text,
    colorNames: text.replace(/\W/g, " ")
      .replace(/\s+/g, " ")
      .split(" ")
      .filter(f => f)
      .map(f => f.toLowerCase())
      .filter(f => Exports.chroma.valid(f))
  })

  const mixer = ({ colors, weights, mode = 'rgb' }) => {
    const ch = getChroma()
    if (weights && weights.length !== colors.length)
      throw `Expected weights array length ${weights.length} to be ${colors.length}`
    return getColorPack(ch.average(colors, mode, weights))
  }



  /**
   * get the best contrast for a color 
   * @param {string} color the target color
   * @param {object} options the light/dark values
   * @param {string} [options.dark = "#000000"] the dark value
   * @param {string} [options.light = "#ffffff"] the light value
   * @param {string} [options.minLuminance = 0.5] betweem 0 and 1 the place to from dark to light
   * @return {string} the selected light ot dark contrast hex
   */
  const getContrast = (color, { dark = DARK, light = LIGHT, mode = "rgb", minLuminance = MIN_LUMINANCE } = {}) => {
    const ch = getChroma()
    return ch(color).luminance(mode) > minLuminance ? dark : light
  }


  // exportable for getting the chroma object
  const getChroma = () => Exports.chroma

  /**
   * @param {*} color any kind of colordefinition that chroma would understand
   * @return {ColorPack} the intepretation of it
   */
  const getColorPack = (color) => {
    const ch = getChroma()
    const base = ch(color)
    return {
      base,
      hex: base.hex(),
      contrast: getContrast(base),
      name: base.name()
    }
  }

  /**
   * get a bunch of info about the colors mentioned in a pirce of text
   * @param {string} text some text that may or may not contain recognizable color names
   * @return {TextToColors} the result of analyzing the text 
   */
  const getColors = (text) => {
    const ch = getChroma()

    // find possible colors in phrase
    const discovered = discover(text)

    // get their color characteristics
    const colorPacks = discovered.colorNames.map(name => getColorPack(name))

    // make a map organized by mentions
    const mentions = Array.from(colorPacks.reduce((p, c) => {

      // if first time in then add to map
      if (!p.get(c.name)) p.set(c.name, {
        color: c,
        noticed: []
      })
      // push the colorpack against this one
      p.get(c.name).noticed.push(c)
      return p
    }, new Map()).values())

      // saturate the colors for those mentioned more than once
      .map(f => {
        const saturated = f.noticed.length > 1 ? getColorPack(f.color.base.saturate(f.noticed.length - 1)) : f.color
        return {
          ...f,
          saturated
        }
      })

    // mix of all the colors mentioned with saturation applied for multi mentions
    // say we have red,red, orange - we'll have 2 mentions (red,orange)
    // red will have a noticed[] length of 2, and will also have a saturated version of the color
    // for orange, the saturated version of the color will be the same , as the color

    // now create a mix of all the colors in the phrase
    // the saturated version is a mix of the saturated colors
    const bases = mentions.map(f => f.color.base)
    const weights = mentions.map(f => f.noticed.length)
    const color = mentions.length > 1 ? mixer({ colors: bases }) : mentions[0].color
    const saturated = mentions.length > 1 ? mixer({ colors: bases, weights }) : mentions[0].saturated

    return {
      ...discovered,
      colorPacks,
      mentions,
      mix: {
        color,
        saturated
      }
    }
  }
  return {
    mixer,
    discover,
    getColors,
    getContrast,
    getChroma,
    getColorPack
  }
})()
