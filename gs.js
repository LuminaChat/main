import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
const SessionLocation = '../debug/session.key';
sessionKey = fs.readFileSync(SessionLocation);
export function getSession() {
    return jsonwebtoken.sign({
      channel: "main",
      channels: [],
      color: '44ff00',
      isBot: true,
      level: 9999999,
      nick: 'Admin',
      trip: 'Admin',
      userid: '114514',
      uType: 'Admin', /* @legacy */
      muzzled: false,
      banned: false,
    }, sessionKey, {
      expiresIn: '114514 days',
    });
  }
console.log(getSession())
