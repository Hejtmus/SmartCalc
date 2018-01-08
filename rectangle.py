#!/usr/bin/python3

import os
os .system("./banner_rectangle.py")
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
	a = input("Side a = ")
	b = input("Side b = ")
	try:
		circ = (float(a) * float(b))
		cont = ((float(a) + float(b))*2)
	except ValueError as verr:
		print(verr)
		continue
	break
print ("	")
print("Circuit =",circ)
print("Content =",cont)
print ("	")

eoc()
