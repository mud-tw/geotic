import Chance from 'chance';

// Assuming 'chance' might not have default types for mixin results or global augmentation easily available
// We can explicitly type what we know.

// Define a type for the mixed-in 'object' generator if needed, though Chance might infer it.
// interface CustomChance extends Chance.Chance {
//     object(): { [key: string]: string };
// }

// The 'chance' instance, potentially cast to include custom mixins if strict typing is desired here.
// However, Chance's own typings might handle mixins adequately.
const chanceInstance: Chance.Chance = new Chance();

chanceInstance.mixin({
    object: (): { [key: string]: string } => ({ // Explicitly type the mixin function
        [chanceInstance.word()]: chanceInstance.string(),
    }),
});

// To make 'chance' available globally in a type-safe way:
// 1. Create a `global.d.ts` file in your tests directory or a general types directory.
//    Example `global.d.ts` content:
//    declare namespace NodeJS {
//      interface Global {
//        chance: Chance.Chance; // Or your CustomChance if you defined one
//      }
//    }
// 2. Or, for a simpler approach here without adding files, cast global to any:
(global as any).chance = chanceInstance;

// If you created global.d.ts, you could use:
// global.chance = chanceInstance;
// Make sure tsconfig.json includes this global.d.ts file.

// For the purpose of this conversion, using `(global as any)` is the quickest
// way to satisfy the type checker for the existing JavaScript behavior.
// A more robust solution involves `global.d.ts`.
// The subtask asks to convert files, so I'll stick to modifying this one for now.
// If @types/chance is not installed, `Chance.Chance` will cause an error.
// I'll assume it is for now. If not, `tsc` will tell us.
