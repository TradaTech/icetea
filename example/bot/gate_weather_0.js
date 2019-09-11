const { Message } = require('@iceteachain/utils')

const showMenu = m => {
    return (m || Message.text('This is the whether station bot.'))
        .buttonRow()
        .button('Hanoi', '1581130')
        .button('Saigon', '1566083')
        .endRow()
        .nextStateAccess('write').done()
}

@contract class WeatherBot {
    @pure botInfo = {
        name: 'Weather bot',
        description: 'The decentralized weather station.'
    }

    @pure oncommand() {
        return showMenu()
    }

    @transaction ontext(id: string, { locale }) {
        const gate = loadContract('system.gate')
        const requestId = gate.request.invokeUpdate({
            path: 'query/weather/current',
            data: { id }
        }, { locale })

        return Message.sendLoading(requestId, { type: 'html' })
    }

    @transaction onOffchainData(requestId, input, result) {
        if (msg.sender === 'system.gate') {
            const r = result.data
            const main = r.weather.main
            const desc = r.weather.description || main
            const icon = r.weather.icon
            const temp = r.main.temp - 273.15 // Kelvin to Celcius
            const location = `${r.location} (${r.country})`
            const m = Message.html(`${location}<br><img alt='${main}' src='${icon}' style='vertical-align:middle' /> <b style='font-size:3em;vertical-align:middle'>${temp}°C</b><br>${desc}`)
            this.emitEvent(requestId, showMenu(m))
        }
    }
}
