const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form') 
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML 

// Options
const urlParams = new URLSearchParams(location.search)
const username = urlParams.get('username');
const room = urlParams.get('room');

const autoscroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild
    
    // Get the height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMesageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMesageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

    socket.on('message',(message)=>{
        console.log(message)
        const html = Mustache.render(messageTemplate,{
            message : message.text,
            username:message.username,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend',html)
        autoscroll()
    })

    socket.on('locationMessage',(message)=>{
        console.log(message)
        const html = Mustache.render(locationTemplate,{
            username : message.username,
            url: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend',html)
        autoscroll()
    })

    socket.on('roomData', ({ room, users })=>{
        const html = Mustache.render(sidebarTemplate,{
            room,
            users
        })
        document.querySelector('#sidebar').innerHTML = html
    })


    $messageForm.addEventListener('submit',(e)=>{
        e.preventDefault()
        //disable form
        $messageFormButton.setAttribute('disabled','disabled')
        const message = e.target.elements.message.value

        socket.emit('sendMessage',message,(error)=>{
            $messageFormButton.removeAttribute('disabled')
            $messageFormInput.value = ''
            $messageFormInput.focus()
            
            if(error){
                return console.log(error)
            }
            console.log('Message delivered!')
        })
        
    })

    $locationButton.addEventListener('click', ()=>{
        if(!navigator.geolocation){
            return alert('Geolocation is not supported')
        }

        $locationButton.setAttribute('disabled','disabled')
        
        navigator.geolocation.getCurrentPosition((position)=>{
            socket.emit('sendLocation',{
                latitude : position.coords.latitude,
                longitude : position.coords.longitude
            },()=>{
                console.log('Location shared')
                $locationButton.removeAttribute('disabled')
            }   
        )
        })
        
 })  

socket.emit('join', {username, room}, (error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }
})