import * as Emoji from 'node-emoji';
import * as _ from 'lodash';
import { Role, RoleInterface, RoleClass, RoleClassInterface } from "./role";
import { Player } from "../player/player";
import { ActionFootprint } from "../util/ActionFootprint";

export class Copycat extends Role implements RoleInterface {
  shadowChoice: Role;
  choice: string;

  constructor() {
    super(RoleClass.COPYCAT);
  }

  wakeUp(bot, msg, players, table) {
    console.log(`${this.name} wake up called`);

    const key = [
      [
        { text: `${this.emoji}${Emoji.get('question')}${Emoji.get('question')}`, callback_data: "COPYCAT_CARD_A" },
        { text: `${Emoji.get('question')}${this.emoji}${Emoji.get('question')}`, callback_data: "COPYCAT_CARD_B" },
        { text: `${Emoji.get('question')}${Emoji.get('question')}${this.emoji}`, callback_data: "COPYCAT_CARD_C" }
      ]
    ];

    bot.editAction(`${this.fullName}, wake up.`, {
      reply_markup: JSON.stringify({ inline_keyboard: key })
    })
      .then((sended) => {
        // `sended` is the sent message.
        console.log(`${this.name} sended >> MessageID:${sended.message_id} Text:${sended.text}`);
      });
  }

  useAbility(bot, msg, players, table, host) {
    let rtnMsg = '';
    let rtnActionEvt: ActionFootprint;
    console.log(`${this.name} useAbility.${(this.shadowChoice ? this.shadowChoice.name : this.name)}: ${msg.data}`);
    console.log(`${this.name} useAbility.choice: ${this.choice}`);
    /*
    if (!this.shadowChoice) {
      if (_.includes(["CARD_A", "CARD_B", "CARD_C"], msg.data)) {
        switch (msg.data) {
          case "CARD_A":
            this.shadowChoice = _.clone(table.getLeft());
            rtnMsg += `${this.shadowChoice.emoji}${Emoji.get('question')}${Emoji.get('question')}`;
            break;
          case "CARD_B":
            this.shadowChoice = _.clone(table.getCenter());
            rtnMsg += `${Emoji.get('question')}${this.shadowChoice.emoji}${Emoji.get('question')}`;
            break;
          case "CARD_C":
            this.shadowChoice = _.clone(table.getRight());
            rtnMsg += `${Emoji.get('question')}${Emoji.get('question')}${this.shadowChoice.emoji}`;
            break;
        }

        console.log(`${this.name} useAbility.Assign: ${this.shadowChoice.name}`);
        rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, `cloned ${rtnMsg}`);
      }
    }
    else {
      rtnMsg = "You already make your choice.";
    }
    */

    if (this.shadowChoice && _.includes(["COPYCAT_CARD_A", "COPYCAT_CARD_B", "COPYCAT_CARD_C"], msg.data)) {
      rtnMsg = "You already make your choice.";
    }
    else
    {
      switch (this.shadowChoice ? this.shadowChoice.name : "") {
        case RoleClass.WEREWOLF.name:
          if (msg.data == "WAKE_UP") {
            this.choice = rtnMsg = this.getRolePlayers(RoleClass.WEREWOLF, players);
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
          }
          else if ((msg.data == "CARD_A" || msg.data == "CARD_B" || msg.data == "CARD_C")) {
            const target: Player[] = _.filter(players, (player: Player) => player.getOriginalRole().checkRole([RoleClass.WEREWOLF]));

            if (this.choice) {
              rtnMsg = "You already make your choice.";
            }
            else if (target.length == 1) {
              this.choice = msg.data;
              rtnMsg = this.watchRole(this.choice, players, table);
              rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
            }
            else {
              rtnMsg = "You cannot view the card.";
            }
          }
          break;
        case RoleClass.MINION.name:
          if (msg.data == "WAKE_UP") {
            this.choice = rtnMsg = this.getRolePlayers(RoleClass.WEREWOLF, players);
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
          }
          break;
        case RoleClass.MASON.name:
          if (msg.data == "WAKE_UP") {
            this.choice = rtnMsg = this.getRolePlayers(RoleClass.MASON, players);
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
          }
          break;
        case RoleClass.SEER.name:
          if (!this.choice) {
            if (/^\d+$/.test(msg.data) || _.includes(["CARD_AB", "CARD_AC", "CARD_BC"], msg.data)) {
              this.choice = msg.data;
              rtnMsg = this.watchRole(this.choice, players, table);
              rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
            }
          }
          else
            rtnMsg = "You already make your choice.";
          break;
        case RoleClass.ROBBER.name:
          if (!this.choice) {
            this.choice = msg.data;
            rtnMsg = this.swapPlayer(this.choice, host, players);
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
          }
          else
            rtnMsg = "You already make your choice.";
          break;
        case RoleClass.TROUBLEMAKER.name:
          const regex = new RegExp(/^\d+_\d+/);
          if (regex.test(this.choice)) {
            //Already chose both player
            rtnMsg = "You already make your choice.";
          }
          else if (this.choice) {
            //Chose only 1 player
            if (host.id == parseInt(msg.data)) {
              rtnMsg = "Buddy, You cannot choose yourself.";
            }
            else if (this.choice == msg.data) {
              this.choice = "";
              rtnMsg = "You have cancelled, choose 2 players to swap.";
            }
            else {
              this.choice += "_" + msg.data;
              rtnMsg = this.swapPlayers(this.choice, players);
              rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
            }
          }
          else {
            //Both not yet chose, now set the first player.
            if (host.id == parseInt(msg.data)) {
              rtnMsg = "Buddy, You cannot choose yourself.";
            }
            else {
              this.choice = msg.data;
              const target: Player = _.find(players, (player: Player) => player.id == parseInt(this.choice));
              rtnMsg = `You have choose ${target.name}, choose 1 more player to swap.`;
            }
          }
          break;
        case RoleClass.DRUNK.name:
          if (!this.choice) {
            if (_.includes(["CARD_A", "CARD_B", "CARD_C"], msg.data)) {
              this.choice = msg.data;
              rtnMsg = this.swapTable(this.choice, host, table);
              rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
            }
          }
          else
            rtnMsg = "You already make your choice.";
          break;
        case RoleClass.INSOMNIAC.name:
          if (msg.data == "WAKE_UP") {
            this.choice = host.getRole().name;
            rtnMsg = host.getRole().fullName;
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg);
          }
          break;
        case "":
          if (_.includes(["COPYCAT_CARD_A", "COPYCAT_CARD_B", "COPYCAT_CARD_C"], msg.data)) {
            switch (msg.data) {
              case "COPYCAT_CARD_A":
                this.shadowChoice = _.clone(table.getLeft());
                rtnMsg += `${this.shadowChoice.emoji}${Emoji.get('question')}${Emoji.get('question')}`;
                break;
              case "COPYCAT_CARD_B":
                this.shadowChoice = _.clone(table.getCenter());
                rtnMsg += `${Emoji.get('question')}${this.shadowChoice.emoji}${Emoji.get('question')}`;
                break;
              case "COPYCAT_CARD_C":
                this.shadowChoice = _.clone(table.getRight());
                rtnMsg += `${Emoji.get('question')}${Emoji.get('question')}${this.shadowChoice.emoji}`;
                break;
            }

            console.log(`${this.name} useAbility.Assign: ${this.shadowChoice.name}`);
            rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, `cloned ${rtnMsg}`);
          }
          break;
        default:
          break;
      }
    }

    bot.showNotification(msg.id, rtnMsg);
    return rtnActionEvt;
  }

  endTurn(bot, msg, players, table, host) {
    console.log(`${this.name} endTurn`);
    let rtnMsg = "";
    let rtnActionEvt: ActionFootprint;

    console.log(`${this.name} endTurn:shadowChoice ${(this.shadowChoice ? this.shadowChoice.name : "undefined")}`);
    console.log(`${this.name} endTurn:choice ${this.choice}`);
    switch (this.shadowChoice ? this.shadowChoice.name : "") {
      case RoleClass.WEREWOLF.name:
        if (!this.choice) {
          this.choice = rtnMsg = this.getRolePlayers(RoleClass.WEREWOLF, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.MINION.name:
        if (!this.choice) {
          this.choice = rtnMsg = this.getRolePlayers(RoleClass.WEREWOLF, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.MASON.name:
        if (!this.choice) {
          this.choice = rtnMsg = this.getRolePlayers(RoleClass.MASON, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.SEER.name:
        if (!this.choice) {
          const key = ["CARD_AB", "CARD_AC", "CARD_BC"];

          _.map(players, (player: Player) => {
            if (player.id !== host.id)
              key.push(player.id + "");
          });

          this.choice = _.shuffle(key)[0];
          console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
          rtnMsg = this.watchRole(this.choice, players, table);

          bot.answerCallbackQuery(msg.id, rtnMsg);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.ROBBER.name:
        if (!this.choice) {
          const key = _.map(players, (player: Player) => player.id + "");
          this.choice = _.shuffle(key)[0];
          console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
          rtnMsg = this.swapPlayer(this.choice, host, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.TROUBLEMAKER.name:
        const regex = new RegExp(/^\d+_\d+/);
        let targets: string[];
        if (regex.test(this.choice)) {
          //Already chose both player
          //do nothing
        }
        else if (this.choice) {
          const key = _.map(players, (player: Player) => player.id + "");
          //Random second player
          targets = _.filter(key, (k) => k !== host.id); // not host
          this.choice += "_" + _.shuffle(targets)[0];

          console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
          rtnMsg = this.swapPlayers(this.choice, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        else {
          const key = _.map(players, (player: Player) => player.id + "");
          targets = _.filter(key, (k) => k !== host.id); // not host
          targets = _.shuffle(targets);
          this.choice = targets.pop() + "_" + targets.pop();

          console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
          rtnMsg = this.swapPlayers(this.choice, players);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.DRUNK.name:
        if (!this.choice) {
          this.choice = _.shuffle(["CARD_A", "CARD_B", "CARD_C"])[0];
          console.log(`${this.name} endTurn:choice_Shuffle ${this.choice}`);
          rtnMsg = this.swapTable(this.choice, host, table);
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case RoleClass.INSOMNIAC.name:
        if (!this.choice) {
          this.choice = host.getRole().name;
          rtnMsg = host.getRole().fullName;
          rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, rtnMsg, true);
        }
        break;
      case "":
        //do nothing
        console.log(`${this.name} endTurn:choice_Shuffle_empty zzz`);
        rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, `${Emoji.get('zzz')}`, true);
        break;
      default:
        //do nothing
        console.log(`${this.name} endTurn:choice_Shuffle_empty zzz`);
        rtnActionEvt = this.actionEvt = new ActionFootprint(host, this.choice, `${Emoji.get('zzz')}`, true);
        break;
    }

    //bot.showNotification(msg.id, rtnMsg);
    return rtnActionEvt;
  }

  checkRole(roleName: RoleClassInterface[], chkShadow: boolean = true) {
    //chkShadow is deduce use shadowChoice or real role(DoppelGanger)
    if (roleName.length == 1 && roleName[0].name.toUpperCase() == RoleClass.COPYCAT.name.toUpperCase())
      return true;
    else
      return !!(_.find(roleName, { name: (chkShadow ? (this.shadowChoice ? this.shadowChoice.name : this.name) : this.name) }));
  }

  // Werewolf, Minion, Mason Handler
  private getRolePlayers(role: RoleClassInterface, players) {
    let target: Player[];
    let rtnMsg: string;
    target = _.filter(players, (player: Player) => player.getOriginalRole().checkRole([role]));
    rtnMsg = _.map(target, (player: Player) => role.emoji + player.name).join(" ");

    return rtnMsg;
  }

  // Seer Handler
  private watchRole(picked: string, players, table) {
    console.log(`${this.name} watchRole: ${picked}`);
    let rtnMsg = "";

    const target: Player = _.find(players, (player: Player) => player.id == parseInt(picked));

    if (target) {
      // if target to a specific guy
      rtnMsg = `${target.getRole().emoji}${target.name}`;
    }
    else {
      switch (picked) {
        case 'CARD_A':
          rtnMsg = `${table.getLeft().fullName}${Emoji.get('question')}${Emoji.get('question')}`;
          break;
        case 'CARD_B':
          rtnMsg = `${Emoji.get('question')}${table.getCenter().fullName}${Emoji.get('question')}`;
          break;
        case 'CARD_C':
          rtnMsg = `${Emoji.get('question')}${Emoji.get('question')}${table.getRight().fullName}`;
          break;
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

  // Robber Handler
  private swapPlayer(picked: string, host, players) {
    console.log(`${this.name} swapPlayer: ${picked}`);
    let tableRole: Role;
    let rtnMsg = "";
    const target: Player = _.find(players, (player: Player) => player.id == parseInt(this.choice));

    if (host && target) {
      // swap the role
      rtnMsg = `${target.getRole().emoji}${target.name}`;
      if (host.id != target.id) host.swapRole(target);
    }
    return rtnMsg;
  }

  // Troublemaker Handler
  private swapPlayers(picked: string, players) {
    console.log(`${this.name} swapPlayers: ${picked}`);
    let tableRole: Role;
    let rtnMsg = "";
    let chosenPlayer = picked.split('_');

    //if (!choice) choice = msg.data;	//To lock the Seer with only one choice
    const host: Player = _.find(players, (player: Player) => player.id == parseInt(chosenPlayer[0]));
    const target: Player = _.find(players, (player: Player) => player.id == parseInt(chosenPlayer[1]));

    if (host && target) {
      // swap the role
      rtnMsg = host.name + `${Emoji.get('arrows_counterclockwise')}` + target.name;
      host.swapRole(target);
    }
    return rtnMsg;
  }

  // Drunk Handler
  private swapTable(picked: string, host, table) {
    console.log(`${this.name} swapTable: ${picked}`);
    let tableRole: Role;
    let rtnMsg = "";

    switch (picked) {
      case "CARD_A":
        tableRole = table.getLeft();
        table.setLeft(host.getRole());
        host.setRole(tableRole);

        rtnMsg += `${this.emoji}${Emoji.get('question')}${Emoji.get('question')}`;
        break;
      case "CARD_B":
        tableRole = table.getCenter();
        table.setCenter(host.getRole());
        host.setRole(tableRole);

        rtnMsg += `${Emoji.get('question')}${this.emoji}${Emoji.get('question')}`;
        break;
      case "CARD_C":
        tableRole = table.getRight();
        table.setRight(host.getRole());
        host.setRole(tableRole);

        rtnMsg += `${Emoji.get('question')}${Emoji.get('question')}${this.emoji}`;
        break;
      default:
        rtnMsg = "Invalid action";
        break;
    }

    return rtnMsg;
  }
}
