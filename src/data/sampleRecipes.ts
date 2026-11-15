import { deriveDifficulty } from '../domain/difficulty'
import { canonicalIngredient, canonicalIngredients } from '../domain/ingredients'
import { isStaple } from '../domain/kitchen'
import type { Cuisine, Equipment, Recipe } from '../domain/types'

/**
 * Saved sample recipes, written for this project in our own schema. They are
 * NOT copied from Spoonacular (its terms forbid storing ingredients or
 * instructions). The app uses them when there is no API key or the API is
 * unavailable, so it always runs offline.
 *
 * Each step has a full wording with heat, timing and a doneness cue, and a
 * brief wording for experienced cooks.
 */

interface Draft {
  name: string
  cuisine: Cuisine
  description: string
  minutes: number
  equipment: Equipment[]
  /** [amount, ingredient] */
  ingredients: [string, string][]
  optional?: [string, string][]
  /** required ingredient -> stand-ins */
  substitutions?: Record<string, string[]>
  /** [full wording, brief wording] */
  steps: [string, string][]
}

const DRAFTS: Draft[] = [
  {
    name: 'Tomato and Egg Stir-Fry',
    cuisine: 'Chinese',
    description: 'Soft scrambled eggs in a sweet-tangy tomato sauce. A classic first dish.',
    minutes: 15,
    equipment: ['stove'],
    ingredients: [
      ['3', 'egg'],
      ['2 medium', 'tomato'],
      ['1 stalk', 'scallion'],
      ['1 tbsp', 'oil'],
      ['1 tsp', 'sugar'],
      ['1/2 tsp', 'salt'],
    ],
    optional: [['1 tsp', 'sesame oil']],
    substitutions: { scallion: ['onion', 'chive'] },
    steps: [
      [
        'Beat the eggs with a pinch of salt until no streaks of white remain. Cut the tomatoes into wedges and slice the scallion.',
        'Beat eggs with salt. Wedge tomatoes, slice scallion.',
      ],
      [
        'Heat the oil in a pan over medium-high heat until it shimmers, about 1 minute. Pour in the eggs and stir gently for 30-40 seconds, until just set but still glossy. Move them to a plate.',
        'Scramble eggs in hot oil until just set; remove.',
      ],
      [
        'Add the tomatoes to the same pan over medium heat. Cook for 3-4 minutes, pressing them lightly, until they soften and release juice.',
        'Cook tomatoes 3-4 min until saucy.',
      ],
      [
        'Stir in the sugar and remaining salt. Return the eggs and fold for 30 seconds, until coated in sauce. Top with scallion.',
        'Season, return eggs, fold, top with scallion.',
      ],
    ],
  },
  {
    name: 'Mapo Tofu',
    cuisine: 'Chinese',
    description: 'Soft tofu and ground pork in a spicy, numbing chili bean sauce.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['400 g', 'tofu'],
      ['150 g', 'ground pork'],
      ['1 1/2 tbsp', 'doubanjiang'],
      ['3 cloves', 'garlic'],
      ['1 thumb', 'ginger'],
      ['2 stalks', 'scallion'],
      ['1 tbsp', 'soy sauce'],
      ['1 tbsp', 'cornstarch'],
      ['1 tbsp', 'oil'],
      ['1 cup', 'water'],
    ],
    optional: [['1/2 tsp', 'sichuan peppercorn']],
    substitutions: {
      'ground pork': ['ground beef', 'mushroom'],
      doubanjiang: ['gochujang', 'chili garlic sauce'],
    },
    steps: [
      [
        'Cut the tofu into 2 cm cubes. Mince the garlic and ginger, slice the scallions, and mix the cornstarch with 2 tbsp of the water.',
        'Cube tofu; mince aromatics; make cornstarch slurry.',
      ],
      [
        'Heat the oil in a pan over medium-high heat. Add the pork and cook for 3-4 minutes, breaking it up, until no pink remains and the edges brown.',
        'Brown pork over medium-high heat.',
      ],
      [
        'Lower the heat to medium. Add the doubanjiang, garlic and ginger and stir for 1 minute, until the oil turns red and smells fragrant.',
        'Fry doubanjiang, garlic, ginger 1 min.',
      ],
      [
        'Add the rest of the water and the soy sauce and bring to a simmer. Slide in the tofu and simmer gently for 5 minutes, nudging rather than stirring so it stays whole.',
        'Add water, soy, tofu; simmer 5 min.',
      ],
      [
        'Stir the slurry, pour it in, and cook for 1 minute, until the sauce is glossy and coats a spoon. Top with scallions.',
        'Thicken with slurry; top with scallions.',
      ],
    ],
  },
  {
    name: 'Egg Fried Rice',
    cuisine: 'Chinese',
    description: 'Day-old rice stir-fried with egg and scallion. Fast and forgiving.',
    minutes: 15,
    equipment: ['stove'],
    ingredients: [
      ['2 cups cooked, cold', 'rice'],
      ['2', 'egg'],
      ['2 stalks', 'scallion'],
      ['1 tbsp', 'soy sauce'],
      ['2 tbsp', 'oil'],
      ['1/4 tsp', 'salt'],
    ],
    optional: [
      ['1/2 cup', 'peas'],
      ['1 small', 'carrot'],
    ],
    substitutions: { scallion: ['onion'] },
    steps: [
      [
        'Break up any clumps in the cold rice with your fingers. Beat the eggs and slice the scallions.',
        'Loosen rice; beat eggs; slice scallions.',
      ],
      [
        'Heat half the oil in a pan over high heat until it shimmers. Add the eggs and scramble for 30 seconds, until just set. Move to a plate.',
        'Scramble eggs in hot oil; remove.',
      ],
      [
        'Add the remaining oil, then the rice. Stir-fry over high heat for 3-4 minutes, pressing the rice flat and tossing, until the grains are hot and separate.',
        'Stir-fry rice on high 3-4 min.',
      ],
      [
        'Pour the soy sauce around the edge of the pan, add the salt, eggs and scallions, and toss for 1 minute, until evenly coloured.',
        'Add soy, salt, eggs, scallions; toss 1 min.',
      ],
    ],
  },
  {
    name: 'Steamed Fish with Ginger and Scallion',
    cuisine: 'Chinese',
    description: 'Gently steamed white fish finished with hot oil and soy sauce.',
    minutes: 20,
    equipment: ['stove', 'steamer'],
    ingredients: [
      ['2 fillets (about 300 g)', 'white fish'],
      ['1 thumb', 'ginger'],
      ['3 stalks', 'scallion'],
      ['2 tbsp', 'soy sauce'],
      ['2 tbsp', 'oil'],
      ['1/2 tsp', 'sugar'],
    ],
    optional: [['a few sprigs', 'cilantro']],
    substitutions: { 'white fish': ['salmon', 'tofu'] },
    steps: [
      [
        'Cut the ginger and scallions into thin matchsticks. Pat the fish dry and place it on a heatproof plate with half the ginger on top.',
        'Julienne ginger and scallion; plate fish with half the ginger.',
      ],
      [
        'Bring 3 cm of water to a rolling boil in the steamer. Steam the fish, covered, for 7-9 minutes, until it turns opaque and flakes easily with a fork.',
        'Steam fish over boiling water 7-9 min until it flakes.',
      ],
      [
        'Pour off the liquid on the plate. Mix the soy sauce and sugar and spoon it over the fish, then pile on the remaining ginger and scallions.',
        'Drain plate; add soy-sugar, ginger, scallion.',
      ],
      [
        'Heat the oil in a small pan over high heat until it just starts to smoke, about 1 minute. Carefully pour it over the scallions; it should sizzle.',
        'Pour smoking-hot oil over the top.',
      ],
    ],
  },
  {
    name: 'Oyakodon (Chicken and Egg Rice Bowl)',
    cuisine: 'Japanese',
    description: 'Chicken and onion simmered in a sweet soy broth, set with egg, over rice.',
    minutes: 20,
    equipment: ['stove'],
    ingredients: [
      ['250 g', 'chicken thigh'],
      ['1/2', 'onion'],
      ['3', 'egg'],
      ['2 tbsp', 'soy sauce'],
      ['2 tbsp', 'mirin'],
      ['2 cups cooked', 'rice'],
      ['1 tsp', 'sugar'],
      ['1/2 cup', 'water'],
    ],
    optional: [
      ['1/2 tsp', 'dashi powder'],
      ['1 stalk', 'scallion'],
    ],
    substitutions: {
      'chicken thigh': ['chicken breast', 'tofu'],
      mirin: ['rice vinegar'],
    },
    steps: [
      [
        'Cut the chicken into bite-size pieces and slice the onion thinly. Lightly beat the eggs, leaving some streaks.',
        'Cut chicken, slice onion, lightly beat eggs.',
      ],
      [
        'Combine the water, soy sauce, mirin and sugar in a small pan and bring to a simmer over medium heat. Add the onion and cook for 2 minutes, until it starts to soften.',
        'Simmer water, soy, mirin, sugar with onion 2 min.',
      ],
      [
        'Add the chicken in one layer and simmer for 5-6 minutes, turning once, until no pink remains when you cut a piece open.',
        'Add chicken; simmer 5-6 min until cooked through.',
      ],
      [
        'Pour the eggs over evenly, cover, and cook on low heat for 1 minute, until the egg is barely set and still soft.',
        'Pour in eggs, cover, 1 min on low.',
      ],
      ['Slide everything over bowls of hot rice.', 'Serve over rice.'],
    ],
  },
  {
    name: 'Miso Soup with Tofu',
    cuisine: 'Japanese',
    description: 'A light soup of miso, tofu and seaweed. Ready in ten minutes.',
    minutes: 10,
    equipment: ['stove'],
    ingredients: [
      ['2 tbsp', 'miso paste'],
      ['150 g', 'tofu'],
      ['1 tbsp dried', 'wakame'],
      ['1 stalk', 'scallion'],
      ['2 1/2 cups', 'water'],
    ],
    optional: [['1 tsp', 'dashi powder']],
    substitutions: { wakame: ['spinach', 'nori'] },
    steps: [
      [
        'Cut the tofu into 1 cm cubes and slice the scallion. Soak the wakame in cold water for 5 minutes, until it unfurls, then drain.',
        'Cube tofu, slice scallion, soak wakame.',
      ],
      [
        'Bring the water to a gentle simmer over medium heat (small bubbles at the edge). Add the tofu and wakame and warm for 2 minutes.',
        'Simmer water; warm tofu and wakame 2 min.',
      ],
      [
        'Turn the heat to low. Put the miso in a ladle, dip it in the pot, and stir until dissolved. Do not let the soup boil once the miso is in, or it turns grainy.',
        'Off the boil, dissolve miso in a ladle.',
      ],
      ['Ladle into bowls and top with scallion.', 'Top with scallion.'],
    ],
  },
  {
    name: 'Teriyaki Chicken',
    cuisine: 'Japanese',
    description: 'Pan-seared chicken thighs glazed in a sticky soy and mirin sauce.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['400 g', 'chicken thigh'],
      ['3 tbsp', 'soy sauce'],
      ['3 tbsp', 'mirin'],
      ['1 tbsp', 'sugar'],
      ['1 tbsp', 'oil'],
    ],
    optional: [
      ['1 tsp', 'sesame seed'],
      ['1 thumb', 'ginger'],
    ],
    substitutions: {
      'chicken thigh': ['chicken breast', 'salmon'],
      mirin: ['honey'],
    },
    steps: [
      [
        'Pat the chicken dry. Stir the soy sauce, mirin and sugar together until the sugar dissolves.',
        'Dry chicken; mix soy, mirin, sugar.',
      ],
      [
        'Heat the oil in a pan over medium heat. Lay the chicken in smooth-side down and cook for 6-7 minutes without moving it, until deep golden.',
        'Sear chicken 6-7 min until golden.',
      ],
      [
        'Flip, cover, and cook for 5 minutes more, until the juices run clear when the thickest part is pierced.',
        'Flip, cover, cook 5 min until juices run clear.',
      ],
      [
        'Pour in the sauce. Simmer uncovered for 2-3 minutes, spooning it over the chicken, until it thickens to a glaze that clings.',
        'Add sauce; reduce 2-3 min to a glaze.',
      ],
    ],
  },
  {
    name: 'Kimchi Fried Rice',
    cuisine: 'Korean',
    description: 'Tangy, spicy fried rice made with ripe kimchi and topped with a fried egg.',
    minutes: 15,
    equipment: ['stove'],
    ingredients: [
      ['1 cup chopped', 'kimchi'],
      ['2 cups cooked, cold', 'rice'],
      ['2', 'egg'],
      ['1 tbsp', 'gochujang'],
      ['1 stalk', 'scallion'],
      ['2 tsp', 'sesame oil'],
      ['1 tbsp', 'oil'],
    ],
    optional: [
      ['1 sheet', 'nori'],
      ['100 g', 'spam'],
    ],
    substitutions: { gochujang: ['chili garlic sauce', 'sriracha'] },
    steps: [
      [
        'Chop the kimchi and slice the scallion. Break up any clumps in the rice.',
        'Chop kimchi, slice scallion, loosen rice.',
      ],
      [
        'Heat half the oil in a pan over medium-high heat. Add the kimchi and cook for 3 minutes, until it darkens slightly and smells sharp and savoury.',
        'Fry kimchi 3 min.',
      ],
      [
        'Add the rice and gochujang. Stir-fry for 3-4 minutes, pressing and tossing, until every grain is evenly orange-red and hot. Stir in the sesame oil.',
        'Add rice and gochujang; stir-fry 3-4 min; add sesame oil.',
      ],
      [
        'In another pan, fry the eggs in the remaining oil over medium heat for 2-3 minutes, until the whites are set and the yolk is still runny.',
        'Fry eggs sunny-side up.',
      ],
      ['Top the rice with an egg and the scallion.', 'Top with egg and scallion.'],
    ],
  },
  {
    name: 'Tteokbokki (Spicy Rice Cakes)',
    cuisine: 'Korean',
    description: 'Chewy rice cakes simmered in a sweet and spicy gochujang sauce.',
    minutes: 30,
    equipment: ['stove'],
    ingredients: [
      ['300 g', 'rice cake'],
      ['2 tbsp', 'gochujang'],
      ['1 tbsp', 'soy sauce'],
      ['1 tbsp', 'sugar'],
      ['2 stalks', 'scallion'],
      ['2 cloves', 'garlic'],
      ['2 cups', 'water'],
    ],
    optional: [
      ['2 sheets', 'fish cake'],
      ['1', 'egg'],
      ['1 tsp', 'gochugaru'],
    ],
    substitutions: { 'rice cake': ['gnocchi'] },
    steps: [
      [
        'If the rice cakes are hard or refrigerated, soak them in warm water for 10 minutes, until pliable. Cut the scallions into 4 cm lengths and mince the garlic.',
        'Soak rice cakes if hard; cut scallions; mince garlic.',
      ],
      [
        'Bring the water to a boil in a wide pan over medium-high heat. Whisk in the gochujang, soy sauce, sugar and garlic until smooth.',
        'Boil water; whisk in gochujang, soy, sugar, garlic.',
      ],
      [
        'Add the rice cakes. Simmer over medium heat for 8-10 minutes, stirring often so they do not stick, until they are soft all the way through and the sauce thickens enough to coat them.',
        'Simmer rice cakes 8-10 min, stirring, until soft and saucy.',
      ],
      [
        'Add the scallions and cook 1 minute more, until just wilted.',
        'Add scallions; 1 min.',
      ],
    ],
  },
  {
    name: 'Gamja Jorim (Soy-Braised Potatoes)',
    cuisine: 'Korean',
    description: 'Potato cubes braised until glossy in a sweet soy glaze. A common side dish.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['2 medium', 'potato'],
      ['3 tbsp', 'soy sauce'],
      ['2 cloves', 'garlic'],
      ['1 tbsp', 'sugar'],
      ['1 tbsp', 'oil'],
      ['3/4 cup', 'water'],
    ],
    optional: [
      ['1 tsp', 'sesame seed'],
      ['1 tsp', 'sesame oil'],
    ],
    substitutions: { potato: ['sweet potato'] },
    steps: [
      [
        'Peel the potatoes and cut them into 2 cm cubes. Rinse in cold water and drain well. Mince the garlic.',
        'Cube and rinse potatoes; mince garlic.',
      ],
      [
        'Heat the oil in a pan over medium heat. Add the potatoes and cook for 4-5 minutes, stirring now and then, until the edges turn translucent.',
        'Fry potatoes 4-5 min until edges turn translucent.',
      ],
      [
        'Add the water, soy sauce, sugar and garlic. Bring to a boil, then simmer over medium-low heat for 10-12 minutes, stirring occasionally, until a fork slides in easily.',
        'Add water, soy, sugar, garlic; simmer 10-12 min until tender.',
      ],
      [
        'Raise the heat to medium-high for 1-2 minutes to reduce the liquid to a sticky glaze that coats the potatoes.',
        'Reduce to a glaze.',
      ],
    ],
  },
  {
    name: 'Dubu Jorim (Braised Tofu with Egg and Potato)',
    cuisine: 'Korean',
    description: 'Pan-fried tofu and potato simmered in a savoury soy sauce, served with a soft egg.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['300 g', 'tofu'],
      ['1 medium', 'potato'],
      ['2', 'egg'],
      ['2 tbsp', 'soy sauce'],
      ['2 cloves', 'garlic'],
      ['1 tbsp', 'oil'],
      ['1/2 cup', 'water'],
    ],
    optional: [
      ['1 stalk', 'scallion'],
      ['1 tsp', 'gochugaru'],
    ],
    substitutions: { potato: ['sweet potato', 'daikon'] },
    steps: [
      [
        'Slice the tofu 1 cm thick and pat it dry. Cut the potato into thin half-moons and mince the garlic.',
        'Slice and dry tofu; slice potato thin; mince garlic.',
      ],
      [
        'Heat the oil in a pan over medium heat. Fry the tofu for 3 minutes per side, until golden. Move it to a plate.',
        'Pan-fry tofu until golden; remove.',
      ],
      [
        'Add the potato to the pan with the water, soy sauce and garlic. Cover and simmer over medium-low heat for 8 minutes, until a fork slides in easily.',
        'Simmer potato with water, soy, garlic, covered, 8 min.',
      ],
      [
        'Return the tofu, crack the eggs into the gaps, cover, and cook for 2-3 minutes, until the whites are set.',
        'Return tofu, add eggs, cover 2-3 min.',
      ],
    ],
  },
  {
    name: 'Pad Kra Pao (Basil Chicken)',
    cuisine: 'Thai',
    description: 'Ground chicken stir-fried with garlic, chili and holy basil, served over rice.',
    minutes: 15,
    equipment: ['stove'],
    ingredients: [
      ['300 g', 'ground chicken'],
      ['1 cup leaves', 'thai basil'],
      ['4 cloves', 'garlic'],
      ['2', 'chili'],
      ['1 tbsp', 'fish sauce'],
      ['1 tbsp', 'soy sauce'],
      ['2 cups cooked', 'rice'],
      ['1 tsp', 'sugar'],
      ['1 tbsp', 'oil'],
    ],
    optional: [
      ['2', 'egg'],
      ['1 tbsp', 'oyster sauce'],
    ],
    substitutions: {
      'ground chicken': ['ground pork', 'tofu'],
      'thai basil': ['basil'],
      'fish sauce': ['soy sauce'],
    },
    steps: [
      [
        'Roughly chop the garlic and chilies together. Pick the basil leaves off the stems.',
        'Chop garlic and chili; pick basil.',
      ],
      [
        'Heat the oil in a pan over high heat until it shimmers. Add the garlic and chili and stir for 15-20 seconds, until fragrant but not browned.',
        'Fry garlic and chili 15-20 sec on high.',
      ],
      [
        'Add the chicken. Stir-fry for 3-4 minutes, breaking it up, until no pink remains and most of the liquid has cooked off.',
        'Add chicken; stir-fry 3-4 min until cooked.',
      ],
      [
        'Add the fish sauce, soy sauce and sugar and toss for 30 seconds. Turn off the heat and stir in the basil until it just wilts. Serve over rice.',
        'Season, kill heat, fold in basil; serve over rice.',
      ],
    ],
  },
  {
    name: 'Thai Green Curry with Chicken',
    cuisine: 'Thai',
    description: 'Chicken and vegetables simmered in coconut milk and green curry paste.',
    minutes: 30,
    equipment: ['stove'],
    ingredients: [
      ['300 g', 'chicken breast'],
      ['400 ml', 'coconut milk'],
      ['2 tbsp', 'green curry paste'],
      ['1', 'bell pepper'],
      ['1 small', 'eggplant'],
      ['1 tbsp', 'fish sauce'],
      ['1 tsp', 'sugar'],
    ],
    optional: [
      ['a handful', 'thai basil'],
      ['2', 'kaffir lime leaf'],
    ],
    substitutions: {
      'chicken breast': ['chicken thigh', 'tofu', 'shrimp'],
      eggplant: ['zucchini', 'green bean'],
      'fish sauce': ['soy sauce'],
    },
    steps: [
      [
        'Slice the chicken thinly and cut the pepper and eggplant into bite-size pieces.',
        'Slice chicken; cut vegetables.',
      ],
      [
        'Spoon the thick top third of the coconut milk into a pot over medium heat. Add the curry paste and stir for 2 minutes, until the oil separates and it smells fragrant.',
        'Fry curry paste in coconut cream 2 min.',
      ],
      [
        'Add the chicken and stir for 2 minutes, until the outside turns white.',
        'Add chicken; cook 2 min.',
      ],
      [
        'Pour in the rest of the coconut milk and add the eggplant. Simmer gently for 8-10 minutes, until the eggplant is soft and the chicken is cooked through.',
        'Add remaining coconut milk and eggplant; simmer 8-10 min.',
      ],
      [
        'Add the pepper, fish sauce and sugar and simmer 2 minutes more, until the pepper is bright and just tender. Taste and adjust.',
        'Add pepper, fish sauce, sugar; 2 min. Adjust seasoning.',
      ],
    ],
  },
  {
    name: 'Thai Omelette (Kai Jeow)',
    cuisine: 'Thai',
    description: 'A puffy, crisp-edged omelette seasoned with fish sauce, eaten over rice.',
    minutes: 10,
    equipment: ['stove'],
    ingredients: [
      ['3', 'egg'],
      ['2 tsp', 'fish sauce'],
      ['1 cup cooked', 'rice'],
      ['3 tbsp', 'oil'],
    ],
    optional: [
      ['1 stalk', 'scallion'],
      ['to serve', 'sriracha'],
    ],
    substitutions: { 'fish sauce': ['soy sauce'] },
    steps: [
      [
        'Beat the eggs with the fish sauce hard for 30 seconds, until frothy.',
        'Beat eggs with fish sauce until frothy.',
      ],
      [
        'Heat the oil in a small pan over medium-high heat until a drop of egg sizzles and puffs at once.',
        'Heat oil until a drop of egg puffs.',
      ],
      [
        'Pour the eggs in from a height. Cook for 1 minute, until the edges are crisp and golden, then flip and cook 30 seconds more.',
        'Pour in eggs; 1 min, flip, 30 sec.',
      ],
      ['Drain briefly and serve over rice.', 'Serve over rice.'],
    ],
  },
  {
    name: 'Lemongrass Chicken (Ga Xao Sa Ot)',
    cuisine: 'Vietnamese',
    description: 'Chicken stir-fried with lemongrass, garlic and chili in a caramelised fish sauce glaze.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['400 g', 'chicken thigh'],
      ['2 stalks', 'lemongrass'],
      ['3 cloves', 'garlic'],
      ['1', 'chili'],
      ['1 1/2 tbsp', 'fish sauce'],
      ['1 tbsp', 'sugar'],
      ['1 tbsp', 'oil'],
    ],
    optional: [
      ['1 small', 'onion'],
      ['2 cups cooked', 'rice'],
    ],
    substitutions: {
      'chicken thigh': ['chicken breast', 'tofu'],
      lemongrass: ['lemon zest'],
    },
    steps: [
      [
        'Cut the chicken into bite-size pieces. Finely mince the tender lower part of the lemongrass with the garlic and chili. Toss the chicken with half of this mixture, the fish sauce and sugar, and rest for 10 minutes.',
        'Cut chicken; mince lemongrass, garlic, chili; marinate chicken with half plus fish sauce and sugar, 10 min.',
      ],
      [
        'Heat the oil in a pan over medium-high heat. Add the remaining lemongrass mixture and stir for 30 seconds, until fragrant.',
        'Fry remaining aromatics 30 sec.',
      ],
      [
        'Add the chicken in one layer. Cook for 3 minutes without stirring to brown it, then stir-fry for 4-5 minutes more, until cooked through and the glaze is sticky and amber.',
        'Sear chicken 3 min, then stir-fry 4-5 min until glazed.',
      ],
    ],
  },
  {
    name: 'Goi Cuon (Fresh Summer Rolls)',
    cuisine: 'Vietnamese',
    description:
      'Fresh rice paper rolls with shrimp, noodles and herbs. Only the noodles are cooked.',
    minutes: 25,
    equipment: ['stove'],
    ingredients: [
      ['8 sheets', 'rice paper'],
      ['200 g cooked', 'shrimp'],
      ['100 g', 'rice vermicelli'],
      ['8 leaves', 'lettuce'],
      ['1 small', 'cucumber'],
      ['a handful', 'mint'],
    ],
    optional: [
      ['a handful', 'cilantro'],
      ['2 tbsp', 'hoisin sauce'],
      ['1 tbsp', 'peanut butter'],
    ],
    substitutions: { shrimp: ['tofu'], mint: ['thai basil'] },
    steps: [
      [
        'Boil the vermicelli for 3-4 minutes, until soft with no hard centre, then rinse under cold water and drain.',
        'Boil vermicelli 3-4 min; rinse cold.',
      ],
      [
        'Halve the shrimp lengthwise and cut the cucumber into thin sticks.',
        'Halve shrimp; cut cucumber into sticks.',
      ],
      [
        'Dip one rice paper sheet in warm water for 5 seconds, until just pliable, and lay it flat. It keeps softening as you work.',
        'Dip a rice paper sheet 5 sec; lay flat.',
      ],
      [
        'Place lettuce, noodles, cucumber and mint on the lower third, and three shrimp halves above them. Fold in the sides, then roll up tightly from the bottom.',
        'Fill, fold in sides, roll tightly.',
      ],
      ['Repeat with the remaining sheets.', 'Repeat.'],
    ],
  },
  {
    name: 'Thit Kho (Caramelised Pork and Eggs)',
    cuisine: 'Vietnamese',
    description: 'Pork belly and boiled eggs braised slowly in coconut water and fish sauce.',
    minutes: 90,
    equipment: ['stove'],
    ingredients: [
      ['500 g', 'pork belly'],
      ['4', 'egg'],
      ['3 tbsp', 'fish sauce'],
      ['2 cups', 'coconut water'],
      ['3 cloves', 'garlic'],
      ['1', 'shallot'],
      ['2 tbsp', 'sugar'],
      ['1 tbsp', 'oil'],
    ],
    optional: [['1', 'chili']],
    substitutions: {
      'pork belly': ['pork shoulder'],
      'coconut water': ['water'],
      shallot: ['onion'],
    },
    steps: [
      [
        'Boil the eggs for 9 minutes, cool them in cold water, and peel. Cut the pork into 3 cm chunks. Mince the garlic and shallot.',
        'Hard-boil and peel eggs; cube pork; mince garlic and shallot.',
      ],
      [
        'Heat the sugar and oil in a pot over medium heat, without stirring, for 3-4 minutes, until it melts into a deep amber caramel. Watch closely; it burns fast.',
        'Make a deep amber caramel with sugar and oil.',
      ],
      [
        'Add the pork, garlic and shallot and stir for 3 minutes, until the pork is coated and lightly browned.',
        'Add pork, garlic, shallot; brown 3 min.',
      ],
      [
        'Add the fish sauce and coconut water and bring to a boil. Skim off any foam, then simmer on low, partly covered, for 45 minutes.',
        'Add fish sauce and coconut water; simmer 45 min.',
      ],
      [
        'Add the eggs and simmer for 15 minutes more, until the pork is tender enough to cut with a spoon and the eggs are tan.',
        'Add eggs; simmer 15 min until pork is spoon-tender.',
      ],
    ],
  },
  {
    name: 'Dal Tadka (Tempered Lentils)',
    cuisine: 'Indian',
    description: 'Soft yellow lentils finished with sizzling cumin, garlic and chili.',
    minutes: 35,
    equipment: ['stove'],
    ingredients: [
      ['1 cup', 'red lentil'],
      ['1', 'onion'],
      ['1', 'tomato'],
      ['3 cloves', 'garlic'],
      ['1 tsp', 'cumin seed'],
      ['1/2 tsp', 'turmeric'],
      ['2 tbsp', 'oil'],
      ['3 cups', 'water'],
      ['1 tsp', 'salt'],
    ],
    optional: [
      ['1', 'chili'],
      ['a handful', 'cilantro'],
      ['1 tbsp', 'butter'],
    ],
    substitutions: { 'red lentil': ['yellow lentil'], 'cumin seed': ['cumin'] },
    steps: [
      [
        'Rinse the lentils until the water runs mostly clear. Simmer them with the water and turmeric over medium heat for 18-20 minutes, until they break down into a thick soup. Stir in the salt.',
        'Rinse lentils; simmer with water and turmeric 18-20 min; salt.',
      ],
      [
        'Meanwhile, finely chop the onion and tomato and slice the garlic.',
        'Chop onion and tomato; slice garlic.',
      ],
      [
        'Heat the oil in a small pan over medium heat. Add the cumin seeds; they should sizzle at once. After 20 seconds add the onion and cook for 5 minutes, until golden.',
        'Sizzle cumin in oil 20 sec; add onion, 5 min until golden.',
      ],
      [
        'Add the garlic and tomato and cook for 3-4 minutes, until the tomato collapses and the oil starts to separate at the edges.',
        'Add garlic and tomato; cook 3-4 min until oil separates.',
      ],
      [
        'Pour the mixture over the lentils and stir. Simmer 2 minutes to combine.',
        'Stir into lentils; simmer 2 min.',
      ],
    ],
  },
  {
    name: 'Aloo Gobi (Potato and Cauliflower)',
    cuisine: 'Indian',
    description: 'Potato and cauliflower cooked dry with turmeric, cumin and ginger.',
    minutes: 35,
    equipment: ['stove'],
    ingredients: [
      ['2 medium', 'potato'],
      ['1/2 head', 'cauliflower'],
      ['1', 'onion'],
      ['1 thumb', 'ginger'],
      ['1 tsp', 'cumin seed'],
      ['1/2 tsp', 'turmeric'],
      ['2 tbsp', 'oil'],
      ['1 tsp', 'salt'],
    ],
    optional: [
      ['1 tsp', 'garam masala'],
      ['a handful', 'cilantro'],
      ['1', 'tomato'],
    ],
    substitutions: { cauliflower: ['broccoli'], 'cumin seed': ['cumin'] },
    steps: [
      [
        'Cut the potatoes into 2 cm cubes and the cauliflower into small florets. Chop the onion and grate the ginger.',
        'Cube potatoes; cut florets; chop onion; grate ginger.',
      ],
      [
        'Heat the oil in a wide pan over medium heat. Add the cumin seeds and let them sizzle for 20 seconds, then add the onion and cook for 4 minutes, until soft and lightly golden.',
        'Sizzle cumin 20 sec; soften onion 4 min.',
      ],
      [
        'Add the ginger, turmeric, salt and potatoes. Stir to coat, cover, and cook on medium-low for 8 minutes, stirring once.',
        'Add ginger, turmeric, salt, potatoes; cover 8 min.',
      ],
      [
        'Add the cauliflower and 2 tbsp water. Cover and cook for 10-12 minutes, stirring every few minutes, until a knife slides into both potato and cauliflower with no resistance.',
        'Add cauliflower and a splash of water; cover 10-12 min until tender.',
      ],
      [
        'Uncover and cook 2 minutes more to dry off any liquid and lightly brown the edges.',
        'Uncover; 2 min to dry and brown.',
      ],
    ],
  },
  {
    name: 'Oven Tandoori-Style Chicken',
    cuisine: 'Indian',
    description: 'Chicken marinated in spiced yogurt and roasted hot until charred at the edges.',
    minutes: 50,
    equipment: ['oven'],
    ingredients: [
      ['600 g', 'chicken thigh'],
      ['1/2 cup', 'yogurt'],
      ['3 cloves', 'garlic'],
      ['1 thumb', 'ginger'],
      ['1 tbsp', 'garam masala'],
      ['1 tsp', 'paprika'],
      ['1/2', 'lemon'],
      ['1 tsp', 'salt'],
      ['1 tbsp', 'oil'],
    ],
    optional: [['1/2 tsp', 'turmeric']],
    substitutions: {
      'chicken thigh': ['chicken breast', 'cauliflower'],
      'garam masala': ['curry powder'],
      lemon: ['lime'],
    },
    steps: [
      [
        'Grate the garlic and ginger into the yogurt. Stir in the garam masala, paprika, salt, oil and the juice of the lemon.',
        'Mix yogurt, grated garlic and ginger, spices, salt, oil, lemon juice.',
      ],
      [
        'Cut two shallow slashes in each piece of chicken, coat well in the marinade, and rest for at least 15 minutes.',
        'Slash chicken; marinate 15 min or longer.',
      ],
      [
        'Heat the oven to 220°C (425°F). Arrange the chicken on a lined tray with space between the pieces.',
        'Oven to 220°C; arrange chicken on a tray.',
      ],
      [
        'Roast for 25-30 minutes, turning once halfway, until the edges are charred and the juices run clear when the thickest part is pierced.',
        'Roast 25-30 min, turning once, until juices run clear.',
      ],
    ],
  },
]

/** Sample ids start here so they can never collide with Spoonacular ids. */
const SAMPLE_ID_BASE = 9_000_000

function toSample(draft: Draft, index: number): Recipe {
  const names = canonicalIngredients(draft.ingredients.map(([, name]) => name))
  const substitutions: Record<string, string[]> = {}
  for (const [ingredient, standIns] of Object.entries(draft.substitutions ?? {})) {
    substitutions[canonicalIngredient(ingredient)] = canonicalIngredients(standIns)
  }
  return {
    id: SAMPLE_ID_BASE + index + 1,
    name: draft.name,
    cuisine: draft.cuisine,
    description: draft.description,
    source: 'sample',
    listedMinutes: draft.minutes,
    difficulty: deriveDifficulty(names.length, draft.steps.length),
    requiredIngredients: names.filter((n) => !isStaple(n)),
    optionalIngredients: canonicalIngredients(
      (draft.optional ?? []).map(([, name]) => name),
    ),
    substitutions,
    stapleIngredients: names.filter(isStaple),
    ingredientLines: [
      ...draft.ingredients.map(([amount, name]) => `${amount} ${name}`),
      ...(draft.optional ?? []).map(
        ([amount, name]) => `${amount} ${name} (optional)`,
      ),
    ],
    requiredEquipment: [...draft.equipment].sort(),
    steps: draft.steps.map(([text, brief], i) => ({
      number: i + 1,
      text,
      brief,
      tools: [],
      ingredients: [],
    })),
  }
}

export const SAMPLE_RECIPES: Recipe[] = DRAFTS.map(toSample)
