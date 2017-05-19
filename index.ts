import * as _ from 'lodash';
import * as TelegramBot from 'node-telegram-bot-api';
import * as Emoji from 'node-emoji';
import { Game } from './src/game';
import { Role, RoleClass, RoleClassInterface } from "./src/role/role";
import { Player } from "./src/player/player";
import { GameEndError } from "./src/error/gameend";

interface GameSetting {
  id: string;
  roles: RoleClassInterface[];
}

let port = process.env.PORT || 8443;
let host = process.env.HOST;

console.log(`port: ${port}`);

const gameSettings: GameSetting[] = [];
const games = [];
const token = '331592410:AAHy9uA7PLWBHmIcNcyNt78hT6XLarrOjHM';
let bot = new TelegramBot(token, { polling: true });
const roles = [
  { name: RoleClass.COPYCAT.name, max: 1 },
  { name: RoleClass.DOPPELGANGER.name, max: 1 },
  { name: RoleClass.WEREWOLF.name, max: 2 },
  { name: RoleClass.MINION.name, max: 1 },
  { name: RoleClass.MASON.name, max: 2 },
  { name: RoleClass.SEER.name, max: 1 },
  { name: RoleClass.ROBBER.name, max: 1 },
  { name: RoleClass.TROUBLEMAKER.name, max: 1 },
  { name: RoleClass.DRUNK.name, max: 1 },
  { name: RoleClass.INSOMNIAC.name, max: 1 },
  { name: RoleClass.VILLAGER.name, max: 3 },
  { name: RoleClass.HUNTER.name, max: 1 },
  { name: RoleClass.TANNER.name, max: 1 }
];

bot.onText(/\/adminlist/, (msg) => {
  if (msg.chat.id <= 0) return; //Prevent the action run in group

  const gameIds: string[] = _.map(games, (g: Game) => g.id + "");
  console.log("/adminlist >> Avaliable Games.Count: " + games.length);
  bot.sendMessage(msg.chat.id, `${Emoji.get('microphone')} Running Game: \n ${gameIds.join("\n")}`);
});

bot.onText(/\/adminsay\s\d+\s\w+/, (msg) => {
  if (msg.chat.id <= 0) return; //Prevent the action run in group

  console.log(`Announ: ${msg.text}`);
  const regex = /\/announ\s(\d+)\s(\w+)/;
  const para: string[] = regex.exec(msg.text);
  const chatId: number = parseInt(para[1]);
  const text: string = para[2];

  if (chatId)
  {
    const game = getGame(chatId);
    if (game)
      bot.sendMessage(chatId, `${Emoji.get('microphone')} (${chatId}) => ${text}`);
    else
      bot.sendMessage(msg.chat.id, `${Emoji.get('bomb')}  Invalid Chat ID '${chatId}' !`);
  }
  else
  {
    bot.sendMessage(msg.chat.id, `${Emoji.get('bomb')}  Invalid request pattern '${msg.text}' !`);
  }
});

bot.onText(/\/setting/, (msg) => {
  const game = getGame(msg.chat.id);

  // validation game isStarted
  if (game && game.isStarted()) {
    sendGameHasBeenStartedMessage(msg.chat.id);
    return;
  }

  const btnPerLine = 3;
  const key = [];
  let pos = 0;

  const gameSetting = _.find(gameSettings, setting => setting.id === msg.chat.id);
  if (gameSetting) {
    gameSetting.roles = []; 
  } else {
    gameSettings.push({ id: msg.chat.id, roles: []});
  }

  _.map(roles, (role) => {
    let row = pos / btnPerLine | 0;
    if (!key[row]) key[row] = [];
    key[row].push({ text: role.name, callback_data: `SET_ROLE_${role.name}` });
    pos++;
  });

  bot.sendMessage(
    msg.chat.id,
    `${Emoji.get('gear')}  Please click to add roles`,
    {
      reply_markup: JSON.stringify({ inline_keyboard: key })
    }
  );
});

bot.onText(/\/newgame/, (msg) => {
  const id = msg.chat.id;
  console.log(`newgame: chat.id: `, id);
  // validation and make sure one channel only have one game
  if (_.find(games, (g) => g.id === id)) {
    bot.sendMessage(
      msg.chat.id,
      `${Emoji.get('no_entry_sign')}  Sorry. There is a game start in this channel, please \/join the game`
    );
    return;
  }

  let gameSetting = _.find(gameSettings, setting => setting.id === msg.chat.id);
  
  if (!gameSetting) {
    /*sendAskForSettingMessage(msg.chat.id);
    return;*/
    gameSetting = { id: msg.chat.id, roles: [] };
    gameSettings.push(gameSetting);

    addGameSettingRole(msg.id, gameSetting, RoleClass.WEREWOLF);         // 1 - 0
    addGameSettingRole(msg.id, gameSetting, RoleClass.WEREWOLF);         // 2 - 0
    addGameSettingRole(msg.id, gameSetting, RoleClass.SEER);             // 3 - 0
    addGameSettingRole(msg.id, gameSetting, RoleClass.ROBBER);           // 4 - 0
    addGameSettingRole(msg.id, gameSetting, RoleClass.INSOMNIAC);        // 5 - 0
    addGameSettingRole(msg.id, gameSetting, RoleClass.TROUBLEMAKER);     // 6 - 3p
    addGameSettingRole(msg.id, gameSetting, RoleClass.MINION);           // 7 - 4p
    addGameSettingRole(msg.id, gameSetting, RoleClass.COPYCAT);          // 8 - 5p
    //addGameSettingRole(msg.id, gameSetting, RoleClass.DOPPELGANGER);     // 8 - 5p
    addGameSettingRole(msg.id, gameSetting, RoleClass.TANNER);           // 9 - 6p
    addGameSettingRole(msg.id, gameSetting, RoleClass.MASON);            // 10- 7p
    addGameSettingRole(msg.id, gameSetting, RoleClass.MASON);            // 11- 8p
    //addGameSettingRole(msg.id, gameSetting, RoleClass.DRUNK);            // 12- 9p
    /*addGameSettingRole(msg.id, gameSetting, RoleClass.VILLAGER);         // 13- 10p
    addGameSettingRole(msg.id, gameSetting, RoleClass.VILLAGER);         // 13- 10p
    addGameSettingRole(msg.id, gameSetting, RoleClass.VILLAGER);         // 13- 10p*/
  }

  const players: Player[] = [
    new Player({ id: msg.from.id, name: msg.from.first_name })
  ];

  games.push(new Game(id, bot, players, gameSetting.roles));
  bot.sendMessage(msg.chat.id, `${Emoji.get('star')}  Created a new game, please \/join the game or \/start the game.`);
  console.log(`GAME ${id} has been created`);
});

bot.onText(/\/join/, (msg) => {
  const game = getGame(msg.chat.id);

  if (!game) return askForCreateNewGame(msg.chat.id);

  // validation game isStarted
  if (game && game.isStarted()) {
    sendGameHasBeenStartedMessage(msg.chat.id);
    return;
  }

  const player = new Player({
    id: msg.from.id,
    name: msg.from.first_name
  });

  game.addPlayer(msg, player);
});

bot.onText(/\/start/, (msg) => {
  const gameSetting = _.find(gameSettings, setting => setting.id === msg.chat.id);
  const game = getGame(msg.chat.id);

  if (!gameSetting) {
    /*sendAskForSettingMessage(msg.chat.id);
    return;*/
  }

  if (!game) return askForCreateNewGame(msg.chat.id);
  // validation game isStarted
  if (game && game.isStarted()) {
    sendGameHasBeenStartedMessage(msg.chat.id);
    return;
  }

  console.log('gameSetting.roles', gameSetting.roles);

  let rtnReady: string = game.setPlayerReady(msg.from.id);
  if (rtnReady == "") {
    game.start(msg)
      .then(() => {
        killGame(msg.chat.id);
      })
      .catch((error) => {
        console.log(`Catch error`, error);
        console.log(`Catch error.message`, error.message);
        console.log(`Catch error.name`, error.name);
        if (error) {
          console.log(`Error`, error);
          // crazy I don't know why it is not instanceof GameEndError
          console.log('error instanceof GameEndError', error instanceof GameEndError);
          // shit way to catch the error
          if (error.message === 'This game is end') {
            console.log('Catch game is ended');
            return;
          }

          bot.sendMessage(msg.chat.id, `${Emoji.get('bomb')}  Error: ${error}.`);
        }
      });
  }
  else {
    bot.sendMessage(msg.chat.id, `${rtnReady}`);
  }
});

bot.onText(/\/delgame/, (msg) => {
  killGame(msg.chat.id);
  bot.sendMessage(msg.chat.id, `${Emoji.get('bomb')}  Game terminated.`);
});

bot.onText(/\/vote/, (msg) => {
  const game = _.find(games, (g) => g.id === msg.chat.id);

  if (!game) return askForCreateNewGame(msg.chat.id);

  game.sendVotingList(msg.chat.id);
});

bot.on('callback_query', (msg) => {
  const gameSetting = _.find(gameSettings, setting => setting.id === msg.message.chat.id);
  
  if (!gameSetting) {
    /*sendAskForSettingMessage(msg.message.chat.id);
    return;*/
  }

  const regex = new RegExp(/^SET_ROLE_(.+?)/);

  if (regex.test(msg.data)) {
    // game setting - set role
    switch (msg.data) {
      case `SET_ROLE_${RoleClass.WEREWOLF.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.WEREWOLF); break;
      case `SET_ROLE_${RoleClass.MINION.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.MINION); break;
      case `SET_ROLE_${RoleClass.MASON.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.MASON); break;
      case `SET_ROLE_${RoleClass.SEER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.SEER); break;
      case `SET_ROLE_${RoleClass.ROBBER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.ROBBER); break;
      case `SET_ROLE_${RoleClass.TROUBLEMAKER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.TROUBLEMAKER); break;
      case `SET_ROLE_${RoleClass.DRUNK.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.DRUNK); break;
      case `SET_ROLE_${RoleClass.INSOMNIAC.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.INSOMNIAC); break;
      case `SET_ROLE_${RoleClass.VILLAGER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.VILLAGER); break;
      case `SET_ROLE_${RoleClass.HUNTER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.HUNTER); break;
      case `SET_ROLE_${RoleClass.TANNER.name}`: addGameSettingRole(msg.id, gameSetting, RoleClass.TANNER); break;
    }

    return;
  }

  // find the user and callback the Game on handler
  const game = getGame(msg.message.chat.id);
  if (game) game.on(msg.data, msg); // Game event
  // return askForCreateNewGame(msg.message.chat.id);
});

function addGameSettingRole(msgId: number, gameSetting: any, role: RoleClassInterface) {
  const roleSetting = _.find(roles, r => r.name === role.name);

  if (_.filter(gameSetting.roles, (r) => r === role).length < roleSetting.max) {
    gameSetting.roles.push(role);
    //bot.answerCallbackQuery(msgId, `${Emoji.get('white_check_mark')}  Added ${role}`);
  } else {
    //bot.answerCallbackQuery(msgId, `${Emoji.get('no_entry_sign')}  Too many ${role}`);
  }

}

bot.onText(/\/showRole/, (msg, match) => {
  let roleList: RoleClassInterface[] = [];
  let role: string[] = [];

  for (var key in RoleClass) {
    if (RoleClass.hasOwnProperty(key)) {
      roleList.push(RoleClass[key]);
    }
  }

  _.map(_.sortBy(roleList, (r: Role) => r.ordering), (r: Role) => {
    role.push(r.emoji + r.name);
  });

  bot.sendMessage(msg.chat.id, `The game has following roles:\n` + role.join("\n"));
});

function killGame(id: number) {
  console.log('Kill Game', id);
  const game: Game = getGame(id);
  console.log('Kill Game (found game): ', (game ? "true" : "false"));

  if (game) {
    _.remove(games, (game: Game) => game.id === id);
    game.end();
  }
  
  console.log('games', _.map(games, (game: Game) => game.id));
}

bot.onText(/\/iisreset/, (msg) => {
  console.log("IIS Reset");
  bot = new TelegramBot(token, { polling: true });  //Rebuild the telegram connection

  killGame(msg.chat.id);

  bot.sendMessage(msg.chat.id, `${Emoji.get('bomb')}  Game Server Reset.`);
});

function getGame(id: number) {
  return _.find(games, (game) => game.id === id);
}

function askForCreateNewGame(msgId: number) {
  return bot.sendMessage(msgId, `${Emoji.get('bomb')}  Sorry. Please create a new game (/newgame)`);
}

function sendGameHasBeenStartedMessage(msgId) {
  bot.sendMessage(msgId, `${Emoji.get('no_entry_sign')}  Sorry. The game has been started, please wait until next game`);
}

function sendAskForSettingMessage(msgId) {
  bot.sendMessage(msgId, `${Emoji.get('no_entry_sign')}  Sorry. Please run /setting first`);
}

console.log(`${Emoji.get('robot_face')}  Hi! I am up`);