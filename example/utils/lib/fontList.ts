type SerifCategory = 'transitional' | 'modern' | 'geometric' | 'humanist' | 'old-style' | 'slab-serif'
type SansSerifCategory = 'grotesque' | 'neo-grotesque' | 'humanist' | 'geometric' | 'rounded' | 'square' | 'superellipse' | 'glyphic'
type FontFeeling = 'business' | 'casual' | 'creative' | 'elegant' | 'modern' | 'playful' | 'technical'
export type FontEntry = {
  family: string
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'
  tags?: (SerifCategory | SansSerifCategory | FontFeeling)[]
  popularity?: number
  reason?: 'popular' | 'trending' | 'recommended'
}

export const mustHaveFonts: FontEntry[] = [
  // Versatile Modern Sans
  { family: 'Poppins', category: 'sans-serif', tags: ['geometric', 'modern', 'business'] },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', tags: ['humanist', 'modern', 'business'] },
  // Premium Serifs
  { family: 'Fraunces', category: 'serif', tags: ['modern', 'elegant', 'creative'] },
  { family: 'Playfair Display', category: 'serif', tags: ['transitional', 'elegant', 'creative'] },
  // Modern Tech-Forward
  { family: 'Space Grotesk', category: 'sans-serif', tags: ['geometric', 'technical', 'modern'] },
  // Statement & Display
  { family: 'Bebas Neue', category: 'display', tags: ['modern', 'creative'] },
  { family: 'Syne', category: 'sans-serif', tags: ['geometric', 'creative', 'modern'] },
  // Modern Workhorses
  { family: 'Inter', category: 'sans-serif', tags: ['neo-grotesque', 'technical', 'business'] },
  { family: 'DM Sans', category: 'sans-serif', tags: ['geometric', 'modern', 'business'] },
  // Elegant Serifs
  { family: 'Cormorant', category: 'serif', tags: ['old-style', 'elegant', 'creative'] },
  { family: 'Spectral', category: 'serif', tags: ['transitional', 'elegant', 'business'] },
  // Classic Serifs
  { family: 'Libre Baskerville', category: 'serif', tags: ['transitional', 'elegant', 'business'] },
  { family: 'Lora', category: 'serif', tags: ['transitional', 'elegant', 'modern'] },
  // Distinctive Sans
  { family: 'Oswald', category: 'sans-serif', tags: ['grotesque', 'modern', 'creative'] },
  { family: 'Work Sans', category: 'sans-serif', tags: ['humanist', 'modern', 'business'] },
  // Personality & Accent
  { family: 'Caveat', category: 'handwriting', tags: ['casual', 'creative', 'playful'] },
  { family: 'Architects Daughter', category: 'handwriting', tags: ['casual', 'playful', 'creative'] },
  { family: 'Gochi Hand', category: 'handwriting', tags: ['playful', 'creative', 'casual'] },
  // Technical/Code
  { family: 'Fira Code', category: 'monospace', tags: ['technical', 'modern'] },
  { family: 'Space Mono', category: 'monospace', tags: ['technical', 'modern', 'creative'] },
  { family: 'DM Mono', category: 'monospace', tags: ['technical', 'modern'] },
  // Additional Workhorses
  { family: 'Manrope', category: 'sans-serif', tags: ['geometric', 'modern', 'business'] },
  { family: 'IBM Plex Sans', category: 'sans-serif', tags: ['neo-grotesque', 'technical', 'business'] },
]

export async function getFontList(): Promise<FontEntry[]> {
  try {
    const mustHave = mustHaveFonts.map(font => ({ ...font, reason: 'recommended' }))
    const mustHaveMap = new Map(mustHave.map(font => [font.family, font]))
    const { default: dynamicFonts } = await import('./fontItems.json') as { default: FontEntry[] }

    const allFonts = dynamicFonts.map(font => ({
      ...font,
      ...(mustHaveMap.get(font.family) && { tags: mustHaveMap.get(font.family)!.tags }),
    }))

    // Add missing must-have fonts
    mustHaveFonts.forEach((font) => {
      if (!allFonts.some(f => f.family === font.family)) {
        allFonts.push(font)
      }
    })

    return allFonts.sort((a, b) => {
      const categories = ['serif', 'sans-serif', 'display', 'handwriting', 'monospace']
      const catDiff = categories.indexOf(a.category) - categories.indexOf(b.category)
      return catDiff || (a.popularity || 1) - (b.popularity || 1)
    })
  }
  catch (error) {
    console.warn('Falling back to must-have fonts:', error)
    return mustHaveFonts
  }
}
