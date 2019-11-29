import tweb3 from './tweb3'
// import { ecc, codec } from '@iceteachain/common'
import $ from 'jquery'
window.$ = $
let _matchInfo = {}

$(document).ready(function () {
  document.getElementById('datePicker').valueAsDate = new Date()
  document.getElementById('timePicker').defaultValue = '20:00'
  const key = window.localStorage.getItem('bot_token')
  console.log(key)
  if (key) {
    byId('key').value = JSON.parse(key).key
    checkKey()
    loadMatch()
  }
  setPreview()
})

function byId (id) {
  return document.getElementById(id)
}

function getField (id) {
  const f = byId(id)
  const v = f.value.trim()
  if (!v) {
    f.focus()
    throw new Error('Please input ' + id)
  }

  return v
}

function checkKey () {
  return tweb3.wallet.importAccount(getField('key'))
}

function getAllField () {
  const info = {}
  info.host = getField('host')
  info.visitor = getField('visitor')
  info.top = getField('top')
  info.topAward = getField('topAward')
  info.award = getField('award')
  info.question = getField('question')
  info.answers = [
    getField('answers1'),
    getField('answers2'),
    getField('answers3')
  ]
  const date = getField('datePicker')
  const time = getField('timePicker')
  info.deadline = Date.parse(date + ' ' + time + ' GMT+7')
  info.icetea = false
  return info
}

function nameToId (name) {
  let resp = ''
  switch (name) {
    case 'Việt Nam':
      resp = 'Vietnam'
      break
    case 'Lào':
      resp = 'Lao'
      break
    case 'Thái Lan':
      resp = 'Thailan'
      break
    default:
      resp = name
      break
  }
  return resp
}

const formatTime = ms => {
  const asiaTime = new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  const d = new Date(asiaTime)
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${String(
    d.getMinutes()
  ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

byId('savekey').addEventListener('click', function (e) {
  const key = getField('key')
  if (key) {
    window.localStorage.setItem('bot_token', JSON.stringify({ key }))
    window.alert('save done')
  }
})

byId('clearkey').addEventListener('click', function (e) {
  byId('key').value = ''
  window.localStorage.setItem('bot_token', JSON.stringify({ key: '' }))
  window.alert('clear done')
})

byId('showkey').addEventListener('click', function (e) {
  byId('key').type = 'text'
})

byId('match').addEventListener('change', function () {
  loadAnswers()
})

function loadAnswers () {
  const matchId = byId('match').value
  const itens = _matchInfo[matchId].info.answers

  byId('matchAnswers').options.length = 0
  for (var i = 0; i < itens.length; i++) {
    var item = itens[i]
    var element = document.createElement('option')
    element.innerText = item
    element.value = i
    byId('matchAnswers').append(element)
  }
}

byId('loadMatch').addEventListener('click', function (e) {
  try {
    checkKey()
  } catch (e) {
    window.alert(e.message)
    return
  }
  loadMatch()
  window.alert('load match done!')
})

byId('setResult').addEventListener('click', function (e) {
  e.preventDefault()
  try {
    checkKey()
  } catch (e) {
    window.alert(e.message)
    return
  }
  const matchId = byId('match').value
  let matchAnswers = byId('matchAnswers').value
  matchAnswers = parseInt(matchAnswers)
  // console.log("matchAnswers", matchAnswers);
  tweb3
    .contract('contract.seagames')
    .methods.setResult(matchAnswers, matchId)
    .sendCommit()
    .then(r => {
      console.log(r)
      window.alert('set resutl done!')
    })
    .catch(e => {
      console.error(e)
      window.alert(e.message)
    })
})

function loadMatch () {
  const getData = tweb3
    .contract('contract.spacerenter')
    .methods.exportState(['shared', 'data'])
    .sendCommit()
  Promise.all([getData]).then(([{ returnValue: data }]) => {
    console.log(data)
    _matchInfo = data
    var itens = Object.keys(data)
    // set empty
    byId('match').options.length = 0
    for (var i = 0; i < itens.length; i++) {
      var item = itens[i]
      var element = document.createElement('option')
      element.innerText = item
      element.value = item
      byId('match').append(element)
    }

    // set default selection
    const today = new Date()
    for (var j = 0; j < itens.length; j++) {
      try {
        var opt = itens[j]
        var matchDate = opt.slice(-10)
        matchDate = new Date(matchDate)

        if (today.getDate() === matchDate.getDate()) {
          byId('match').value = opt
          break
        } else if (today.getDate() <= matchDate.getDate() + 1) {
          byId('match').value = opt
        }
      } catch (e) {}
    }
    loadAnswers()
  })
}

byId('setMatchInfo').addEventListener('submit', function (e) {
  e.preventDefault()
  try {
    checkKey()
  } catch (e) {
    window.alert(e.message)
    return
  }

  const info = getAllField()
  const date = getField('datePicker')
  const matchId =
    nameToId(info.host) + '-' + nameToId(info.visitor) + '-' + date

  tweb3
    .contract('contract.seagames')
    .methods.setMatchInfo(matchId, info)
    .sendCommit()
    .then(r => {
      console.log(r)
      // window.alert(e.message);
    })
    .catch(e => {
      console.error(e)
      window.alert(e.message)
    })

  const desc = getDescription(info)
  const botname = getField('botname')

  tweb3
    .contract('contract.seagames')
    .methods.setBotInfo(botname, desc, 'Chơi lại')
    .sendCommit()
    .then(r => {
      console.log(r)
      // window.alert(e.message);
    })
    .catch(e => {
      console.error(e)
      window.alert(e.message)
    })
})

byId('preview').addEventListener('click', function (e) {
  setPreview()
})

function setPreview () {
  const info = getAllField()
  const botname = getField('botname')
  document.getElementById('description').innerHTML =
    `<b>${botname}</b> <br>` +
    getDescription(info) +
    `<br><br><b>Trận ${info.host} - ${info.visitor}</b> (${formatTime(
      info.deadline
    )})`

  byId(
    'matchInfo'
  ).innerHTML = `<span>Trận ${info.host} - ${info.visitor}</span>`
  byId('matchQuestion').innerHTML = `<span>${info.question}</span>`
  byId('matchAnswers1').innerHTML = `<span>${info.answers[0]}</span>`
  byId('matchAnswers2').innerHTML = `<span>${info.answers[1]}</span>`
  byId('matchAnswers3').innerHTML = `<span>${info.answers[2]}</span>`
}

function getDescription (info) {
  const link = domain =>
    `<a href='https://${domain}' target='_blank'>${domain}</a>`
  const linkSky = link('skygarden.vn')
  const topNum = getField('topNum')
  const awardNum = getField('awardNum')
  const awardLink = getField('awardLink')

  const resp = `Giải thưởng:<br>
  - ${info.top * topNum} ${info.topAward} cho ${
    info.top
  } bạn đoán đúng may mắn nhất<br>
  - ${awardNum} <a href='${awardLink}' target='_blank'>${info.award}</a>
  cho TẤT CẢ người đoán đúng.<br>
  Nhận tại các nhà hàng thuộc ${linkSky} ở TP HCM.`
  return resp
}
