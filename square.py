#!/usr/bin/python3

import os

os .system("./banner_square.py")

def eoc(): 	#eoc je end of calc
	import time
	while True:
		end = input("Done? [Y/n]")
		if end == "Y":
			print("ok")
			break
		elif end == "n":
			os .system("cd SmartCalc/")
			os .system("./menu.sh")


while True:
	try:
		a = input("Side a = ")
		obv = float("4")*float(a)
		obs = float(a)*float(a)
		
	except ValueError as verr:
		print(verr)
		continue
	else:
		break
		
print ("	")
print ("	")
print ("Content =", obs)
print ("	")
print ("Circuit =", obv)
print ("	")

eoc()
