import { Role, RoleInterface } from "./role";

export class Villager extends Role implements RoleInterface {
  constructor() {
    super({
      emoji: Role.VILLAGER_EMOJI,
      name: Role.VILLAGER,
      ordering: 999
    });
  }

  wakeUp(bot, msg, players, table, host) {
    console.log(`${this.name} wake up called`);

  }

  useAbility(bot, msg, players, table, host) {
    console.log(`${this.name} useAbility.msg.data: ${msg.data}`);
    return null;
  }

  endTurn(bot, msg, players, table, host) {
    console.log(`${this.name} endTurn`);
    return null;
  }
}
