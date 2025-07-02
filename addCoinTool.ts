import { tool } from "@langchain/core/tools";
import type { playerTool } from "./ITool.ts";
import type { GameScene } from "../../phaser/gameScene.ts";
import { z } from "zod";

export class AddCoinTool implements playerTool {
  sceneGetter: () => GameScene;

  constructor(sceneGetter: () => GameScene) {
    this.sceneGetter = sceneGetter;
  }

  static addCoinArgsSchema = z.object({
    x: z.number().optional().default(100),
    y: z.number().optional().default(100),
  });

  toolCall = tool(
    async (args: z.infer<typeof AddCoinTool.addCoinArgsSchema>) => {
      const gameScene = this.sceneGetter();
      if (!gameScene) {
        return "Tool Failed: Game scene is not available.";
      }

      const key = "tilemap_sheet";
      const frame = 190;

      if (!gameScene.textures.exists(key)) {
        return `Tool Failed: Texture "${key}" not found. Ensure it is preloaded.`;
      }

      const coin = gameScene.physics.add.sprite(args.x, args.y, key, frame);
      coin.setImmovable(true);

      // Add to coin group for management
      gameScene["coinGroup"].add(coin);

      // Collide with ground
      gameScene.physics.add.collider(coin, gameScene["groundLayer"]);

      // Enable overlap collection with player
      gameScene.physics.add.overlap(gameScene["player"], coin, (_player, obj2) => {
        obj2.destroy();
        gameScene.sound.play("partCollect");
        gameScene["collectedItems"]++;
        gameScene["partCountText"].setText(
          `Parts Collected: ${gameScene["collectedItems"]} / 10`
        );
      });

      return `Successfully added a collectible coin at (${args.x}, ${args.y}).`;
    },
    {
      name: "addCoin",
      schema: AddCoinTool.addCoinArgsSchema,
      description: "Adds a collectible coin to the game at the specified (x, y) location.",
    }
  );
}
