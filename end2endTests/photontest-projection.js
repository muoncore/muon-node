function eventHandler(state, event) {

  var user = event.payload.user;

  var key = user.last.replace(/ /g,'');

  if (!(key in state)) {
    state[key] = {};
  }

  state[key].id = user.id;
  state[key].fullname = user.first + ' ' + user.last;

  var username = null;

  if(user.last.length > 8) {
    username = (user.last.substring(0,7) + user.first.charAt(0)).toLowerCase();
  }
  else {
    username = (user.last + user.first.charAt(0)).toLowerCase();
  }

  state[key].username = username.replace(/ /g,'');
  state[key].first = user.first;
  state[key].last = user.last;
  state[key].password = user.password;
  state[key].active = user.active;

  return state;
}