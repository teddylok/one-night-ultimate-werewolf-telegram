import * as Emoji from 'node-emoji';
import * as _ from 'lodash';
import { Role, RoleInterface, RoleClass } from "./role";
import { Player } from "../player/player";
import { ActionFootprint } from "../util/ActionFootprint";

export class Seer extends Role implements RoleInterface {
  choice: string;

  constructor() {
    super(RoleClass.SEER);
  }

  wakeUp(bot, msg, players, table) {
    console.log(`${this.code} wake up called`);
    // sendMessage [AB] [BC] [AC] [Player1] [Player2] ...
    // lock the option when callback_query
    const key = [];
    let pos = 0;
    let btnPerLine = 3;

    _.map(players, (player: Player) => {
      let row = pos / btnPerLine | 0;
      if (!key[row]) key[row] = [];
      key[row].push({ text: player.name, callback_data: "" + player.id });
      pos++;
    });

    key.push([
      { text: `${this.emoji}${this.emoji}${Emoji.get('question')}`, callback_data: "CARD_AB" },
      { text: `${this.emoji}${Emoji.get('question')}${this.emoji}`, callback_data: "CARD_AC" },
      { text: `${Emoji.get('question')}${this.emoji}${this.emoji}`, callback_data: "CARD_BC" }
    ]);

    //bot.sendMessage(msg.chat.id, `${this.emoji}  ${this.name}, wake up. You may look at another player's card or two of the center cards.`, {
    bot.editAction(this.fullName + this.lang.getString("ROLE_WAKE_UP") + this.lang.getString("ROLE_WAKE_UP_SEER"), {
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
      if (!/^\d+$/.test(msg.data) && !_.includes(["CARD_AB", "CARD_AC", "CARD_BC"], msg.data))
        rtnMsg = this.lang.getString("ROLE_INVALID_ACTION");
      else {
        // TODO: avoid syntax error for testing first
        this.choice = msg.data;
        rtnMsg = this.watchRole(this.choice, players, table);

        if (_.includes(["CARD_AB", "CARD_AC", "CARD_BC"], this.choice))
          rtnMsg = this.lang.getString("ROLE_ACTION_WATCH_TABLE") + rtnMsg;
        else
          rtnMsg = this.lang.getString("ROLE_ACTION_ROLE_PLAYER") + rtnMsg;

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
      const key = ["CARD_AB", "CARD_AC", "CARD_BC"];

      _.map(players, (player: Player) => {
        if (player.id !== host.id)
          key.push(player.id+"");
      });

      this.choice = _.shuffle(key)[0];
      console.log(`${this.code} endTurn:choice_Shuffle ${this.choice}`);
      rtnMsg = this.watchRole(this.choice, players, table);

      if (_.includes(["CARD_AB", "CARD_AC", "CARD_BC"], this.choice))
        rtnMsg = this.lang.getString("ROLE_ACTION_WATCH_TABLE") + rtnMsg;
      else
        rtnMsg = this.lang.getString("ROLE_ACTION_ROLE_PLAYER") + rtnMsg;

      console.log(`${this.code} endTurn.rtnMsg: ${rtnMsg}`);

      //bot.showNotification(msg.id, rtnMsg);
      this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
      return this.actionEvt;
    }
  }

  private watchRole(picked: string, players, table) {
    let rtnMsg = "";

    const target: Player = _.find(players, (player: Player) => player.id == parseInt(picked));

    if (target) {
      // if target to a specific guy
      rtnMsg = `${target.getRole().emoji}${target.name}`;
    }
    else {
      switch (picked) {
        case 'CARD_AB':
          rtnMsg = `${table.getLeft().fullName}${table.getCenter().fullName}${Emoji.get('question')}`;
          break;
        case 'CARD_AC':
          rtnMsg = `${table.getLeft().fullName}${Emoji.get('question')}${table.getRight().fullName}`;
          break;
        case 'CARD_BC':
          rtnMsg = `${Emoji.get('question')}${table.getCenter().fullName}${table.getRight().fullName}`;
          break;
        default:
          break;
      }
    }

    return rtnMsg;
  }
}
