/**
  * @author Marzavec ( https://github.com/marzavec )
  * @summary Released them from the void
  * @version 1.0.0
  * @description Lockroom
  * @module lock
  */

import {
  isChannelOwner,
  } from '../utility/_UAC.js';
  /*
  const _c=require('../utility/_Channels.js')  
  LrList=_c.LrList
  */
  /**
    * Executes when invoked by a remote client
    * @param {Object} env - Enviroment object with references to core, server, socket & payload
    * @public
    * @return {void}
    */
  export async function run({ core, server, socket }) {
    // increase rate limit chance and ignore if not admin or mod
    if (!isChannelOwner(socket.level)) {
      return server.police.frisk(socket.address, 10);
    }
  
    // remove arrest records
    //server.police.clear();
  
    //core.stats.set('users-banned', 0);
  
    //console.log(`${socket.nick} [${socket.trip}] unbanned all`);
    LrList.push(socket.channel)
    // reply with success
    server.reply({
      cmd: 'info',
      text: 'Room Locked',
      channel: socket.channel, // @todo Multichannel
    }, socket);
  
    // notify mods
    server.broadcast({
      cmd: 'info',
      text: `${socket.nick}#${socket.trip} locked ${socket.channel}`,
      channel: false, // @todo Multichannel, false for global
    }, { level: isChannelOwner });
  
    return true;
  }
  
  /**
    * Module meta information
    * @public
    * @typedef {Object} lockroom/info
    * @property {string} name - Module command name
    * @property {string} category - Module category name
    * @property {string} description - Information about module
    * @property {string} usage - Information about module usage
    */
  export const info = {
    name: 'lock',
    category: 'ChannelOwner',
    description: '锁房',
    usage: `
      API: { cmd: 'lock' }`,
  };
  