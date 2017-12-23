#!/usr/bin/python3

import os

os .system("./banner_sphere.py")

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
		r = input("r = ")
		sur = float(r)*float(r)*float(3.14159)*float(4)
		vol = float(r)*float(r)*float(r)*float("4")/float("3")*float("3.14159")
		
	except ValueError as verr:
		print(verr)
		continue
	else:
		break

print("Surface =",sur)
print("Volume =",vol)
print("")

eoc()
