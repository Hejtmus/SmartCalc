#!/bin/bash


read -p "[Are u sure? y/n]" un #un = uninstall
if [[ $un == "y" ]]; then
	sudo rm -rf /bin/SmartCalc.py
	sudo rm -rf /etc/SmartCalc
	sudo rm -rf *

fi
