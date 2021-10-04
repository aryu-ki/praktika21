let drags = document.getElementsByClassName('draggable')

function dragListener(e) {
    let shiftX, shiftY
    let top, left
    function mdown(e)
    {
        top = e.target.getBoundingClientRect().top
        left = e.target.getBoundingClientRect().left
        shiftX = e.clientX-e.target.offsetLeft
        shiftX = e.clientY-e.target.offsetTop

        e.target.style.position = 'absolute'
        e.target.style.top = top + 'px'
        e.target.style.left = left + 'px'
    }

    function mmove(e) {
        if(e.clientX-shiftX<0 || e.clientX+(e.target.offsetWidth-shiftX) > document.documentElement.offsetWidth) 
        e.target.style.top = e.clientY-shiftY + 'px'
        e.target.style.left = e.clientX-shiftX + 'px'
    }

    function scrollX(e)
    {
        
    }
    function scrollY(e)
    {

    }
}
