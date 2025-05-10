export const CONFIG = {
  DEBUG: true,
  SCENES: {
    MAIN_MENU: "MAIN_MENU",
    GAME: "GAME",
    SCORE_SCREEN: "SCORE_SCREEN",
  },
  TRASH_COMBINATIONS: {
    glass: ["up", "down", "up", "down"],
    plastic: ["left", "right", "left", "right"],
    metal: ["up", "up", "down", "down"],
    organic: ["down", "down", "up", "up"],
    nonRecyclable: ["up", "up", "up", "up"]
  },
  LEVELS_CONFIG: [
    {
      SCORE_TO_BEAT: 20,
      SPEED: 0.5,
    },
    {
      SCORE_TO_BEAT: 50,
      SPEED: 2,
    },
    {
      SCORE_TO_BEAT: 70,
      SPEED: 4,
    },
  ],
};
