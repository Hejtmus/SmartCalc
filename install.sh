#!/bin/bash

clear

echo Installing
echo 
chmod +x terms_of_use.py

python3 terms_of_use.py

read -p "[Agree/Disagree]" tou #tou = terms of use
if [[ $tou == "Agree" ]]; then
	sudo apt-get install python3
	sudo apt-get install python3-pip
	pip3 install colorama
	chmod +x banner_basic_operations.py
	chmod +x banner.py
	chmod +x banner_triangle.py
	chmod +x triangle.py
	chmod +x square.py
	chmod +x calc.py
	chmod +x menu.sh
	chmod +x banner_square.py
	chmod +x banner_circle.py
	chmod +x circle.py
	chmod +x rectangle.py
	chmod +x banner_rectangle.py
	chmod +x banner_sphere.py
	chmod +x sphere.py
	chmod +x menu_list.py
	chmod +x ohms_law.py
	chmod +x banner_ohms_law.py
	chmod +x launch.sh


	clear

	echo 
	echo "Done, calculator will be launched after 3 sec."
	echo "3"
	sleep 1
	echo "2"
	sleep 1
	echo "1"
	sleep 1
	echo "0"

	bash menu.sh
elif [[ $tou == "Disagree" ]]; then
	echo "Sad :/"
fi
