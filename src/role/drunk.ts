import * as Emoji from 'node-emoji';
import * as _ from 'lodash';
import { Role, RoleInterface } from "./role";
import { Player } from "../player/player";

export class Drunk extends Role implements RoleInterface {
  choice: string;

  constructor() {
    super({
      emoji: Role.DRUNK_EMOJI,
      name: Role.DRUNK,
      ordering: 80
    });
  }

  wakeUp(bot, msg, players, table, host) {
    console.log(`${this.name} wake up called`);
    // sendMessage [left] [center] [right], choose one of the center card to exchange

    const key = [
      [
        { text: `${this.emoji}${Emoji.get('question')}${Emoji.get('question')}`, callback_data: "CARD_A" },
        { text: `${Emoji.get('question')}${this.emoji}${Emoji.get('question')}`, callback_data: "CARD_B" },
        { text: `${Emoji.get('question')}${Emoji.get('question')}${this.emoji}`, callback_data: "CARD_C" }
      ]
    ];
    
    bot.sendMessage(msg.chat.id, `${this.fullName}, wake up.`, {
      reply_markup: JSON.stringify({ inline_keyboard: key })
    })
      .then((sended) => {
        // `sended` is the sent message.
        console.log(`${this.name} sended >> MessageID:${sended.message_id} Text:${sended.text}`);
      });
  }

  useAbility(bot, msg, players, table, host) {
    // TODO: avoid syntax error for testing first
    console.log(`${this.name} useAbility.msg.data: ${msg.data}`);
    let rtnMsg = '';

    if (this.choice) {
      rtnMsg = "You already make your choice.";
    }
    else {
      if (!_.includes(["CARD_A", "CARD_B", "CARD_C"], msg.data))
        rtnMsg = "Invalid action";
      else {
        this.choice = msg.data;
        rtnMsg = this.swapTable(this.choice, host, table);
      }
    }

    bot.answerCallbackQuery(msg.id, rtnMsg);
    return this.actionLog("useAbility", host, this.choice);
  }

  endTurn(bot, msg, players, table, host) {
    console.log(`${this.name} endTurn`);
    let rtnMsg = "";

    console.log(`${this.name} endTurn:choice ${this.choice}`);
    if (!this.choice) {
      this.choice = _.shuffle(["CARD_A", "CARD_B", "CARD_C"])[0];
      console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
      rtnMsg = this.swapTable(this.choice, host, table);

      bot.answerCallbackQuery(msg.id, rtnMsg);
      return this.actionLog("endTurn", host, this.choice);
    }
  }

  private swapTable(picked: string, host, table) {
    let tableRole: Role;
    let rtnMsg = "";

    switch (picked) {
      case "CARD_A":
        tableRole = table.getLeft();
        table.setLeft(host.getRole());
        host.setRole(tableRole);

        rtnMsg += "left";
        break;
      case "CARD_B":
        tableRole = table.getCenter();
        table.setCenter(host.getRole());
        host.setRole(tableRole);

        rtnMsg += "centre";
        break;
      case "CARD_C":
        tableRole = table.getRight();
        table.setRight(host.getRole());
        host.setRole(tableRole);

        rtnMsg += "right";
        break;
      default:
        rtnMsg = "Invalid action";
        break;
    }

    return rtnMsg;
  }

  actionLog(phase, host, choice) {
    let actionMsg = "";

    actionMsg = (phase == "useAbility" ? "swapped table card " : "donzed, God swapped table card ");

    if (this.choice == "CARD_A")
      actionMsg += `${host.getRole().emoji}${Emoji.get('question')}${Emoji.get('question')}`;
    else if (this.choice == "CARD_B")
      actionMsg += `${Emoji.get('question')}${host.getRole().emoji}${Emoji.get('question')}`;
    else if (this.choice == "CARD_C")
      actionMsg += `${Emoji.get('question')}${Emoji.get('question')}${host.getRole().emoji}`;

    return super.footprint(host, choice, actionMsg)
  }
}
