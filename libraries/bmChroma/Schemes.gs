const Schemes = {

  _schemes: null,


  throwError(name, scheme, throwOnError) {
    if (throwOnError) {
      throw `No such color ${name} in scheme ${scheme}`
    }
    return null
  },

  getScheme(name, throwOnError = true) {
    const s = Schemes.schemes[name]
    if (throwOnError && !s) throw `Scheme ${name} doesnt exist`
    return s
  },

  listScheme(name, throwOnError = true) {
    const s = this.getScheme(name, throwOnError)
    return s && s.listScheme()
  },

  get schemes() {
    // first access will populate wil build in cystom schemes
    if (!this._schemes) {
      this._schemes = {}
      const b = Exports.BuiltInCustomSchemes
      if (b) {
        Reflect.ownKeys(b).forEach(name => this.addScheme({ name, scheme: b[name] }))
      }
    }
    return this._schemes
  },

  addScheme({ name, scheme } = {}) {
    const s = this.getScheme(name, false)
    if (s) throw `scheme with name ${name} already exists`
    Schemes._schemes[name] = new Exports.CustomScheme({ name, scheme })
    return this.getScheme(name)
  },


  getColor(name, throwOnError) {
    const bits = name.split("-")
    const schemeName = bits && bits[0]
    const foundScheme = schemeName && Schemes.getScheme(schemeName, throwOnError)
    if (!foundScheme) {
      return Schemes.throwError(name, schemeName, throwOnError)
    }

    // if no variants, return the base
    const { scheme } = foundScheme
    const color = scheme && scheme[bits[1]]
    if (!color) Schemes.throwError(name, schemeName, throwOnError)
    if (bits.length === 2) return color.base

    // combine the rest for example darken-1
    const { variants } = color
    const variant = variants && variants[bits.slice(2).join('-')]
    if (!variant) return Schemes.throwError(name, foundScheme.name, throwOnError)

    return variant.hex
  }


}
