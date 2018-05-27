/*
    <SmartCalc-web web version of SmartCalc.>
    Copyright (C) <2018>  <Filip Holčík>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


let x = 0;
let op;

function oprt(x, y) {
    if (op === 2){
        return parseFloat(x) + parseFloat(y)
    }
    else if (op === 3){
        return x - y
    }
    else if (op === 4){
        return multiply(x)
    }
    else{
        if (x === 0){
            return 1 / y
        }
        else if (y === 0){
            return 'Nulou sa nedelí'
        }
        else{
            return x / y
        }
    }
}

function multiply(y) {
    if (x === 0) {
        x = y;
        return x
    }
    else {
        x *= y;
        return x
    }

}

function rectangle(a, b) {
    circ = (2 * a) + (2 * b);
    cont = a * b;
    return "Obvod = " + circ + " Obsah = " + cont

}

function ohm(r, u, i) {
    if (r === '?') {
        r = u / i
    }
    else if (u === '?') {
        u = i * r
    }
    else if (i === '?') {
        i = u / r
    }
    else if (r === '' || u === '' || i === '') {
        return 'Nesmie byť žiadne prázdne polie'
    }
    else {
        return 'Niečo nieje v poriadku'
    }
    p = u * i;
    return '<table style="width: 99%">' +
        '<tr><th>Odpor</th><td>'+ r +'Ω</td></tr>' +
        '<tr><th>Napätie</th><td>'+ u +'V</td></tr>' +
        '<tr><th>Prúd</th><td>'+ i +'A</td></tr>' +
        '<tr><th>Výkon</th><td>'+ p +'W</td></tr>' +
        '</table>'
}

function drop(d) {
document.getElementById(d).classList.toggle("show");
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-menu");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}
}

function bmi(a, b) {
    b = parseFloat(b);
    a /= 100;
    return (b) / (a ** 2)
}
function bmi_hlt(a) {
    if (a > 0 && a < 18.5) {
        document.getElementById('pdv').style.color='#FF0000';
    }
    else if (a >= 18.5 && a <= 24.9) {
        document.getElementById('nmm').style.color='#FF0000';
    }
    else if (a >= 25 && a <= 29.9) {
        document.getElementById('nm').style.color='#FF0000';
    }
    else if (a >= 30 && a <= 34.9) {
        document.getElementById('ofs').style.color='#FF0000';
    }
    else if (a >= 35 && a <= 39.9) {
        document.getElementById('oss').style.color='#FF0000';
    }
    else if (a > 40) {
        document.getElementById('ots').style.color='#FF0000';
    }
}

function calcm() {
    var mode = document.getElementById("mode");
    var slct = mode.options[mode.selectedIndex].value;
    if (slct === 'pl') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 2;
    }

    else if (slct === 'mi')  {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 3;
    }

    else if (slct === 'ti') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'hidden';
        document.getElementById('rob').style.visibility = 'visible';
        op = 4;
    }

    else if (slct === 'di') {
        document.getElementById('mlt').innerHTML = ('');
        document.getElementById('fst').style.visibility = 'visible';
        document.getElementById('scnd').style.visibility = 'visible';
        document.getElementById('rob').style.visibility = 'visible';
        op = 5;
    }

    else {
        document.getElementById('mlt').innerHTML = ('Vyber si operáciu');
        document.getElementById('fst').style.visibility = 'hidden';
        document.getElementById('scnd').style.visibility = 'hidden';
        document.getElementById('rob').style.visibility = 'hidden';
        op = 1;
    }
}