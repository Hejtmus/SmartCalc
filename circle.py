#!/usr/bin/python3

import os
os .system("./banner_circle.py")
print ("	")

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
	r = input("r = ")
	try:
		circ = (float(r) * 2 * 3.14159)
		cont = (float(r) * float(r) * 3.14159)
	except ValueError as verr:
		print(verr)
		continue
	break
print ("	")
print("Circuit =",circ)
print("Content =",cont)
print ("	")

eoc()
