import * as Emoji from 'node-emoji';
import * as _ from 'lodash';
import { Role, RoleInterface, RoleClass } from "./role";
import { Player } from "../player/player";
import { ActionFootprint } from "../util/ActionFootprint";

export class Robber extends Role implements RoleInterface {
  choice: string;

  constructor() {
    super(RoleClass.ROBBER);
  }

  wakeUp(bot, msg, players, table) {
    console.log(`${this.code} wake up called`);
    // sendMessage [Player1] [Player2] [DO NOTHING] ...
    // lock the option when callback_query to notify the new role
    const key = [];
    let pos = 0;
    let btnPerLine = 3;

    _.map(players, (player: Player) => {
      let row = pos / btnPerLine | 0;
      if (!key[row]) key[row] = [];
      key[row].push({ text: player.name, callback_data: "" + player.id });
      pos++;
    });

    bot.editAction(this.fullName + this.lang.getString("ROLE_WAKE_UP") + this.lang.getString("ROLE_WAKE_UP_ROBBER"), {
      reply_markup: JSON.stringify({ inline_keyboard: key })
    })
      .then((sended) => {
        // `sended` is the sent message.
        console.log(`${this.code} sended >> MessageID:${sended.message_id} Text:${sended.text}`);
      });
  }

  useAbility(bot, msg, players, table, host) {
    console.log(`${this.code} useAbility.msg.data: ${msg.data}`);
    let rtnActionEvt: ActionFootprint;
    let rtnMsg = '';

    if (this.choice) {
      rtnMsg = this.lang.getString("ROLE_ALREADY_CHOOSE");
    }
    else {
      if (!/^\d+$/.test(msg.data))
        rtnMsg = this.lang.getString("ROLE_INVALID_ACTION");
      else {
        this.choice = msg.data;
        rtnMsg = this.swapPlayer(this.choice, host, players);
        rtnMsg = this.lang.getString("ROLE_ACTION_ROBBER") + rtnMsg;
        rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
      }
    }

    bot.showNotification(msg.id, rtnMsg);
    return rtnActionEvt;
  }

  endTurn(bot, msg, players, table, host) {
    console.log(`${this.code} endTurn`);
    let rtnMsg = "";

    console.log(`${this.code} endTurn:choice ${this.choice}`);
    if (!this.choice) {
      const key = _.map(players, (player: Player) => player.id+"");
      this.choice = _.shuffle(key)[0];
      console.log(`${this.code} endTurn:choice_Shuffle ${this.choice}`);
      rtnMsg = this.swapPlayer(this.choice, host, players);
      rtnMsg = this.lang.getString("ROLE_ACTION_ROBBER") + rtnMsg;

      //bot.showNotification(msg.id, rtnMsg);
      this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
      return this.actionEvt;
    }
  }

  private swapPlayer(picked: string, host, players) {
    let tableRole: Role;
    let rtnMsg = "";
    const target: Player = _.find(players, (player: Player) => player.id == parseInt(this.choice));

    if (host && target) {
      // swap the role
      rtnMsg = `${target.name} ${target.getRole().fullName}`;
      if (host.id != target.id) host.swapRole(target);
    }
    return rtnMsg;
  }
}
