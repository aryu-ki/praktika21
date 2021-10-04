let showForm = function () {
    queryForm.hidden = false
}

let createQuery = async function (e) {
    e.preventDefault()

    let form = document.getElementsByTagName('form')[0]

    let xhr = new XMLHttpRequest()

    let body = new FormData(form)

    xhr.open('POST', '/search', true)

    xhr.onreadystatechange = function (e) {
        console.log(e)
    }

    xhr.send(body)
}

let resetForm = function (e) {
    querynameInp.value = ''
    querydistInp.value = ''

    document.getElementById('queryForm').hidden = true
}

createQueryBtn.addEventListener('click', showForm)
saveQuery.addEventListener('click', createQuery)
cancelQuery.addEventListener('click', resetForm)
