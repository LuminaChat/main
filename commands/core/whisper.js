/**
  * @author Marzavec ( https://github.com/marzavec )
  * @summary Send whisper
  * @version 1.0.0
  * @description Display text on target users screen that only they can see
  * @module whisper
  * @todo This should be changed to it's own event type, instead of `info`
        and accept a `userid` rather than `nick`
  */

import {
  findUser,
} from '../utility/_Channels.js';
import {
  Errors,
} from '../utility/_Constants.js';
import {
  legacyWhisperOut,
  legacyWhisperReply,
} from '../utility/_LegacyFunctions.js';

/**
  * Check and trim string provided by remote client
  * @param {string} text - Subject string
  * @private
  * @todo Move into utility module
  * @return {string|boolean}
  */
const parseText = (text) => {
  // verifies user input is text
  if (typeof text !== 'string') {
    return false;
  }

  let sanitizedText = text;

  // strip newlines from beginning and end
  sanitizedText = sanitizedText.replace(/^\s*\n|^\s+$|\n\s*$/g, '');
  // replace 3+ newlines with just 2 newlines
  sanitizedText = sanitizedText.replace(/\n{3,}/g, '\n\n');

  return sanitizedText;
};

/**
  * Executes when invoked by a remote client
  * @param {Object} env - Enviroment object with references to core, server, socket & payload
  * @public
  * @return {void}
  */
export async function run({ server, socket, payload }) {
  // if this is a legacy client add missing params to payload
  if (socket.hcProtocol === 1) {
    payload.channel = socket.channel; // eslint-disable-line no-param-reassign
  }

  // verify user input
  const text = parseText(payload.text);

  if (!text) {
    // lets not send objects or empty text, yea?
    return server.police.frisk(socket.address, 13);
  }

  // check for spam
  const score = text.length / 83 / 4;
  if (server.police.frisk(socket.address, score)) {
    return server.reply({
      cmd: 'warn', // @todo Add numeric error code as `id`
      text: '太快了！',
      channel: socket.channel, // @todo Multichannel
    }, socket);
  }

  const targetUser = findUser(server, payload);
  if (!targetUser) {
    return server.reply({
      cmd: 'warn',
      text: '找不到用户',
      id: Errors.Global.UNKNOWN_USER,
      channel: socket.channel, // @todo Multichannel
    }, socket);
  }

  const outgoingPayload = {
    cmd: 'whisper',
    channel: socket.channel, // @todo Multichannel
    from: socket.userid,
    to: targetUser.userid,
    text,
  };

  // send invite notice to target client
  if (targetUser.hcProtocol === 1) {
    server.reply(legacyWhisperOut(outgoingPayload, socket), targetUser);
  } else {
    server.reply(outgoingPayload, targetUser);
  }

  // send invite notice to this client
  if (socket.hcProtocol === 1) {
    server.reply(legacyWhisperReply(outgoingPayload, targetUser.nick), socket);
  } else {
    server.reply(outgoingPayload, socket);
  }

  targetUser.whisperReply = socket.nick;

  return true;
}

/**
  * Automatically executes once after server is ready to register this modules hooks
  * @param {Object} server - Reference to server enviroment object
  * @public
  * @return {void}
  */
export function initHooks(server) {
  server.registerHook('in', 'chat', this.whisperCheck.bind(this), 20);
}

/**
  * Executes every time an incoming chat command is invoked;
  * hooks chat commands checking for /whisper
  * @param {Object} env - Enviroment object with references to core, server, socket & payload
  * @public
  * @return {{Object|boolean|string}} Object = same/altered payload,
  * false = suppress action,
  * string = error
  */
export function whisperCheck({
  core, server, socket, payload,
}) {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/whisper ') || payload.text.startsWith('/w ')) {
    const input = payload.text.split(' ');

    // If there is no nickname target parameter
    if (!input[1]) {
      server.reply({
        cmd: 'warn', // @todo Add numeric error code as `id`
        text: '使用`/help whisper`查看帮助',
        channel: socket.channel, // @todo Multichannel
      }, socket);

      return false;
    }

    const target = input[1].replace(/@/g, '');
    input.splice(0, 2);
    const whisperText = input.join(' ');

    this.run({
      core,
      server,
      socket,
      payload: {
        cmd: 'whisper',
        channel: socket.channel, // @todo Multichannel
        nick: target,
        text: whisperText,
      },
    });

    return false;
  }

  if (payload.text.startsWith('/reply ') || payload.text.startsWith('/r ')) {
    if (typeof socket.whisperReply === 'undefined') {
      server.reply({
        cmd: 'warn', // @todo Add numeric error code as `id`
        text: 'Cannot reply to nobody',
        channel: socket.channel, // @todo Multichannel
      }, socket);

      return false;
    }

    const input = payload.text.split(' ');
    input.splice(0, 1);
    const whisperText = input.join(' ');

    this.run({
      core,
      server,
      socket,
      payload: {
        cmd: 'whisper',
        nick: socket.whisperReply,
        channel: socket.channel, // @todo Multichannel
        text: whisperText,
      },
    });

    return false;
  }

  return payload;
}

/**
  * The following payload properties are required to invoke this module:
  * "nick", "text"
  * @public
  * @typedef {Array} whisper/requiredData
  */
export const requiredData = ['nick', 'text'];

/**
  * Module meta information
  * @public
  * @typedef {Object} whisper/info
  * @property {string} name - Module command name
  * @property {string} category - Module category name
  * @property {string} description - Information about module
  * @property {string} usage - Information about module usage
  */
export const info = {
  name: 'whisper',
  category: 'core',
  description: 'Display text on target users screen that only they can see',
  usage: `
    API: { cmd: 'whisper', nick: '<target name>', text: '<text to whisper>' }
    Text: /whisper <target name> <text to whisper>
    Text: /w <target name> <text to whisper>
    Alt Text: /reply <text to whisper, this will auto reply to the last person who whispered to you>
    Alt Text: /r <text to whisper, this will auto reply to the last person who whispered to you>`,
};
