#!/usr/bin/python3

import os
os .system("./banner_rectangle.py")
print ("	")

def eoc(): 	#eoc je end of calc
	while True:
		end = input("Done? [Y/n]")
		if end == "Y":
			print("ok")
			os .system("cd SmartCalc/")
			os .system("./menu.sh")
		elif end == "n":
			time.sleep(5)
			continue

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
