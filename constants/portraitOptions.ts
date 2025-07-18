export type PortraitAttributeSet = {
  outfits: string[];
  accessories: string[];
  backgrounds: string[];
  art_styles: string[];
  moods: string[];
};

export type PortraitType =
  | "royalty"
  | "superhero"
  | "cartoon"
  | "vintage"
  | "fantasy"
  | "rockstar"
  | "sports"
  | "festival"
  | "futuristic"
  | "abstract";

export const portraitOptions: Record<PortraitType, PortraitAttributeSet> = {
  royalty: {
    outfits: [
      "red velvet robe",
      "royal tunic",
      "fur-lined cloak",
      "embroidered gown",
      "gold-trimmed armor"
    ],
    accessories: [
      "golden crown",
      "scepter",
      "pearl necklace",
      "royal orb",
      "jeweled ring"
    ],
    backgrounds: [
      "palace throne room",
      "castle balcony",
      "marble hall",
      "velvet draped chamber",
      "gold-framed portrait room"
    ],
    art_styles: [
      "18th-century oil painting",
      "baroque portrait",
      "renaissance realism",
      "victorian art",
      "classic museum style"
    ],
    moods: ["majestic", "proud", "regal", "composed", "wise"],
  },

  superhero: {
    outfits: [
      "red cape and bodysuit",
      "silver armor suit",
      "mask and gloves",
      "stealth jumpsuit",
      "utility belt suit"
    ],
    accessories: [
      "lightning bolt emblem",
      "tech visor",
      "shield",
      "grappling hook",
      "power gauntlets"
    ],
    backgrounds: [
      "night city rooftop",
      "comic explosion frame",
      "futuristic city",
      "lightning storm sky",
      "warehouse battle scene"
    ],
    art_styles: [
      "comic book panel",
      "digital action art",
      "pop graphic style",
      "gritty superhero cover",
      "stylized ink outline"
    ],
    moods: ["fierce", "determined", "powerful", "stoic", "heroic"],
  },

  cartoon: {
    outfits: [
      "hoodie and sneakers",
      "striped shirt",
      "t-shirt and bowtie",
      "cape and glasses",
      "polka dot outfit"
    ],
    accessories: [
      "big sunglasses",
      "balloon",
      "comic speech bubble",
      "skateboard",
      "cartoon hat"
    ],
    backgrounds: [
      "suburban street",
      "backyard with toys",
      "schoolyard",
      "comic strip frame",
      "fun park"
    ],
    art_styles: [
      "Pixar-style 3D",
      "2D animation flat",
      "bubble cartoon",
      "hand-drawn sketch",
      "bright comic render"
    ],
    moods: ["happy", "playful", "goofy", "surprised", "energetic"],
  },

  vintage: {
    outfits: [
      "1920s tuxedo",
      "flapper dress",
      "newsboy cap outfit",
      "vintage polka suit",
      "bowtie and vest"
    ],
    accessories: [
      "gramophone",
      "pocket watch",
      "monocle",
      "bowler hat",
      "retro sunglasses"
    ],
    backgrounds: [
      "old photo studio",
      "jazz club",
      "sepia street scene",
      "antique living room",
      "vintage wallpaper room"
    ],
    art_styles: [
      "sepia tone photo",
      "noir-style sketch",
      "1920s poster print",
      "black and white realism",
      "retro magazine style"
    ],
    moods: ["stoic", "nostalgic", "classy", "dreamy", "proud"],
  },

  fantasy: {
    outfits: [
      "wizard robe",
      "enchanted cloak",
      "fairy wings",
      "dragon scale armor",
      "mystic tunic"
    ],
    accessories: [
      "magic wand",
      "crystal orb",
      "glowing book",
      "enchanted sword",
      "tiara"
    ],
    backgrounds: [
      "glowing forest",
      "mountain temple",
      "floating island",
      "crystal cave",
      "enchanted garden"
    ],
    art_styles: [
      "high fantasy painting",
      "dreamy watercolor",
      "ethereal light style",
      "digital spell art",
      "fantasy realism"
    ],
    moods: ["serene", "magical", "mysterious", "curious", "powerful"],
  },

  rockstar: {
    outfits: [
      "leather jacket",
      "band tee",
      "glam vest",
      "ripped jeans",
      "stage jumpsuit"
    ],
    accessories: [
      "electric guitar",
      "mic stand",
      "shades",
      "concert wristbands",
      "amp speaker"
    ],
    backgrounds: [
      "concert stage",
      "backstage mirror",
      "screaming crowd",
      "neon sign alley",
      "foggy club"
    ],
    art_styles: [
      "rock poster art",
      "album cover style",
      "neon pop",
      "graffiti-style digital",
      "gritty photo overlay"
    ],
    moods: ["bold", "wild", "confident", "rebellious", "cool"],
  },

  sports: {
    outfits: [
      "soccer jersey",
      "football pads",
      "boxing gear",
      "track uniform",
      "basketball outfit"
    ],
    accessories: [
      "gold medal",
      "foam finger",
      "sweatband",
      "whistle",
      "sports drink"
    ],
    backgrounds: [
      "stadium field",
      "gym interior",
      "podium stand",
      "training zone",
      "scoreboard backdrop"
    ],
    art_styles: [
      "sports magazine cover",
      "digital motion blur",
      "action photo style",
      "trading card style",
      "stylized broadcast render"
    ],
    moods: ["competitive", "pumped", "victorious", "serious", "focused"],
  },

  festival: {
    outfits: [
      "tie-dye shirt",
      "fringe vest",
      "crop top + shorts",
      "oversized sunglasses look",
      "peace sign tank"
    ],
    accessories: [
      "flower crown",
      "glow sticks",
      "beaded necklace",
      "peace sign earring",
      "rainbow flag"
    ],
    backgrounds: [
      "sunset field",
      "festival crowd",
      "string light tent",
      "desert stage",
      "colorful mural wall"
    ],
    art_styles: [
      "dreamy festival filter",
      "psychedelic overlay",
      "warm lens flare",
      "digital collage",
      "polaroid retro look"
    ],
    moods: ["joyful", "chill", "dreamy", "vibrant", "fun"],
  },

  futuristic: {
    outfits: [
      "chrome armor",
      "LED suit",
      "space jumpsuit",
      "robotic harness",
      "sci-fi trench coat"
    ],
    accessories: [
      "hologram display",
      "neon visor",
      "circuit tattoos",
      "plasma shield",
      "robotic arm"
    ],
    backgrounds: [
      "neon city",
      "space station",
      "digital grid",
      "AI lab",
      "asteroid colony"
    ],
    art_styles: [
      "cyberpunk",
      "concept sci-fi",
      "glitch effect",
      "synthwave art",
      "future blueprint"
    ],
    moods: ["commanding", "curious", "serious", "powerful", "analytical"],
  },

  abstract: {
    outfits: [
      "geometric robe",
      "color-block suit",
      "fragmented cloak",
      "paint-splatter vest",
      "transparent mesh"
    ],
    accessories: [
      "floating shapes",
      "neon halo",
      "brushstroke pattern",
      "glitch mask",
      "mirrored glasses"
    ],
    backgrounds: [
      "gradient swirl",
      "cubist chaos",
      "spiral tunnel",
      "fractured reflections",
      "pop art burst"
    ],
    art_styles: [
      "abstract expressionism",
      "cubism",
      "pop art",
      "digital glitch",
      "surreal modernism"
    ],
    moods: ["expressive", "chaotic", "curious", "surreal", "intense"],
  }
}; 