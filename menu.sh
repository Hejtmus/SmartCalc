#!/bin/bash

cd SmartCalc/

clear

python3 banner.py

python3 menu_list.py

read -p "Function? " func #výber funkcie
if [[ $func == "1" ]]; then
	clear
	python3 calc.py #spustenie
elif [[ $func == "2" ]]; then
	clear
	python3 square.py
elif [[ $func == "3" ]]; then
	clear
	python3 rectangle.py
elif [[ $func == "4" ]]; then
	clear
	python3 triangle.py
elif [[ $func == "5" ]]; then
	clear
	python3 circle.py
elif [[ $func == "8" ]]; then
	clear
	python3 sphere.py
elif [[ $func == "9" ]]; then
	clear
	python3 ohms_law.py
fi

echo "						"
echo "						"
echo "						"
echo "						"
echo "						"
