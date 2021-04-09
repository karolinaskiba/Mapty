'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

class Workout {
    date = new Date();
    id  = ((Date.now() + '').slice(-10));
    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance =  distance;
        this.duration = duration;
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDay()}`

    }
}

class Running extends Workout {
    type= 'running'
    constructor(coords, distance, duration, cadance){
        super(coords, distance, duration);
        this.cadance =  cadance;
        this.calcPace();
        this._setDescription();


    }

    calcPace(){
        this.pace = this.duration / this.distance;
        return this.pace
    }
}

class Cycling extends Workout {
    type= 'cycling'

    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.clacSpeed();
        this._setDescription();


    }
    clacSpeed(){
        this.speed = this.distance /  this.duration / 60;
        return this.speed;
    }
}


class App{
    #map;
    #mapEvent;
    #workouts = [];

    constructor(){
        this._getPosition();
        this._getLocaleStorage();
        form.addEventListener('submit',this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPpup.bind(this))

    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this))
        }
    }

    _loadMap(position){

        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude, longitude];


        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        L.marker(coords).addTo(this.#map)
            .bindPopup('Home')
            .openPopup();

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work=>{
            this._renderWorkout(work)
        })

    }

    _showForm(mapE){
        this.#mapEvent = mapE
        form.classList.remove('hidden');
        inputDistance.focus();
    }
    _hideForms(){
        inputDistance.value = inputDuration.value = inputCadence.value = '';
        form.style.display='none'
        form.classList.add('hidden');
        setTimeout(()=>{ form.style.display='grid', 1000 })
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
        const allPositive  = (...inputs)=> inputs.every(inp => inp > 0)
        e.preventDefault();

        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;


        //if workout cycling create cycling object
        if( type ==='running' ){
            const cadance = +inputCadence.value;
            //check if data is valid
            if(!validInputs(distance, duration, cadance) || !allPositive(distance, duration, cadance)){ return alert('Inputs have to be a positive number') }
            workout = new Running([lat, lng], distance, duration, cadance);
        }
        //if workout running create running object
        if( type ==='cycling' ){
            const elevetion = +inputElevation.value;
            //check if data is valid
            if(!validInputs(distance, duration, elevetion) || !allPositive(distance, duration)){ return alert('Inputs have to be a positive number') }
            workout = new Cycling([lat, lng], distance, duration, elevetion);


        }

        // add a new object to workout array
        this.#workouts.push(workout)

        // render workou marker
        this._renderWorkoutMarker(workout);

        //render workout on list
        this._renderWorkout(workout)

        //hide form, clera inputs
        this._hideForms();

        //set localeStorage
        this._setLocalStorage();

    }
    _renderWorkoutMarker(workout){

        L
        .marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose:false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        .openPopup()
        .setPopupContent(`${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️' } ${workout.description}`);
    }

    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">‍${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️' }</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
             <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
        `;

        if(workout.type === 'running'){
            html += `
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadance}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>

            `;
        }

        if(workout.type === 'cycling'){
            html +=`
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            </li>
            `;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPpup(e){
        const workoutEl =e.targer.closest('.workout');
        if(!workoutEl) return;
        const workout = this.#workouts.find((work)=>{work.id === workoutEl.dataset.id});

        this.#map.setView(workout.coords, 13,{
            animate:true, pan:{
                duration:1,
            }
        })
    }
    _setLocalStorage(){
        localStorage.setItem('workouts', JSON,stringify(this.#workouts))
    }
    _getLocaleStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));

        if(!data){ return }

        this.#workouts = data;

        this.#workouts.forEach(work=>{
            this._renderWorkout(work)
        })
    }
    reset(){
        localStorage.remove(workout);
        location.reload();
    }

}

const app = new App();




