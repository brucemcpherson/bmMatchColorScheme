function test() {

  const t = Exports.Schemes.getColor
  const c = ColorWords.getChroma()
  console.log(JSON.stringify(
    ColorWords.getColors(
      'theres a mc-red-lighten-2 house with mc-amber-accent-2 windows and a mc-purple and teal door'
    ))
  )

  console.log(t('mc-black'))

  console.log(c('mc-red-lighten-2'))
  console.log(Exports.Schemes.listScheme('mc'))

}

