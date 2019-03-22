const { InputCollectionSteps, Message } = require('https://github.com/TradaTech/icetea/icetea/bot/Message.js')
const helper = require('https://github.com/TradaTech/icetea/example/astrobot/helper.js')
const { calendar } = require('https://github.com/TradaTech/icetea/example/astrobot/lunar.js')


@contract class AstroBot extends InputCollectionSteps {

    botInfo = {
        name: 'Thầy Măng Cụt',
        description: 'Thầy Măng Cụt biết nhiều thứ, nhưng ông chỉ nói đủ.',
        ontext_type: 'transaction'
    }

    getSteps() {
        return ['Boarding', 'Terms', 'Name', 'Gender', 'Dob', 'Hour']
    }

    @state #conversations = {}

    @transaction ontext(text: string) {
        const who = msg.sender
        const cons = this.#conversations
        if (!cons[who]) {
            cons[who] = {
                step: 0
            }
        }
        const result = this.proceed(text, cons[who])

        // save state back
        this.#conversations = cons

        return result
    }

    succeedBoarding() {
        return Message.html('Kính chào quý khách. Tôi là <i>Thầy Măng Cụt</i>,' + 
            ' chuyên hành nghề bói Tử Vi trên Icetea blockchain.', 'html')
            .text('Nếu bạn muốn xem thì bấm nút phía dưới. Không muốn thì thôi.')
            .button('Tôi là người Việt và sinh ở Việt Nam', 'start')
            .done()
    }

    succeedTerms() {
        return Message.text('Tốt quá. Vì tôi không biết xem cho người nước ngoài hoặc sinh ở nước ngoài.')
            .text('Đầu tiên, hãy cho biết tên (bao gồm cả tên lót nếu nó là riêng của bạn)')
            .input('Ngọc Trinh')
            .done()
    }

    collectName(name, collector) {
        collector.name = helper.toTitleCase(name)
        return collector.name
    }

    succeedName(name) {
        return Message.text(`OK ${name}. Còn giới tính?`)
            .buttonRow()
            .button('Name', 'male')
            .button('Nữ', 'female')
            .endRow()
            .done()
    }

    collectGender(genderText, collector) {
        collector.gender = (genderText === 'male')
        return collector.gender
    }

    succeedGender() {
        return Message.text('Tiếp tục.')
            .text('Ngày tháng năm sinh theo dạng ngày/tháng/năm.')
            .input('dd/mm/yyyy')
            .done() 
    }

    collectDob(dateString, collector) {
        collector.dob = helper.parseDate(dateString)
        return collector.dob
    }

    succeedDob(value) {
        return Message.text('Hãy chọn giờ sinh theo múi giờ GMT+7. Nhớ là múi giờ GMT+7.')
            .select('Chọn giờ sinh')
            .add([
                '0am ~ 1am',
                '1am ~ 3am',
                '3am ~ 5am',
                '5am ~ 7am',
                '7am ~ 9am',
                '9am ~ 11am',
                '11am ~ 1pm',
                '1pm ~ 3pm',
                '3pm ~ 5pm',
                '5pm ~ 7pm',
                '7pm ~ 9pm',
                '9pm ~ 11pm',
                '11pm ~ 12pm'
            ])
            .done()
    }

    failDob() {
        return Message.text('Ngày nhập sai định dạng.')
            .text('Ví dụ nhập đúng: 23/8/2001')
            .input('dd/mm/yyyy')
            .done()
    }
}