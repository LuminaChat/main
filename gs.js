import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';
const SessionLocation = '../debug/session.key';
var sessionKey = fs.readFileSync(SessionLocation);
export function getSession() {
    return jsonwebtoken.sign({
      channel: "main",
      channels: [],
      color: '44ff00',
      isBot: true,
      level: 9999999,
      nick: 'Admin',
      trip: 'Admin',
      userid: 114514,
      uType: 'Admin', /* @legacy */
      muzzled: false,
      banned: false,
    }, sessionKey, {
      expiresIn: '7 days',
    });
  }
export function notifyFailure(){
  console.log('Inv')
  errornf()
}
console.log(getSession())
var session = jsonwebtoken.verify(getSession(), sessionKey);
console.log(session)
export function check(session){
if (typeof session.channel !== 'string') {
  return notifyFailure();
}

if (Array.isArray(session.channels) === false) {
  return notifyFailure();
}

if (typeof session.color !== 'string' && typeof session.color !== 'boolean') {
  return notifyFailure();
}

if (typeof session.isBot !== 'boolean') {
  return notifyFailure();
}

if (typeof session.level !== 'number') {
  return notifyFailure();
}

//if (verifyNickname(session.nick) === false) {
//  return notifyFailure(server, socket);
//}

if (typeof session.trip !== 'string') {
  return notifyFailure();
}

if (typeof session.userid !== 'number') {
  return notifyFailure();
}

if (typeof session.uType !== 'string') {
  return notifyFailure();
}

if (typeof session.muzzled !== 'boolean') {
  return notifyFailure();
}

if (typeof session.banned !== 'boolean') {
  return notifyFailure();
}
}
check(session)