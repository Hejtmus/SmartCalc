#!/usr/bin/python3

import os
os .system("./banner_ohms_law.py")
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

print ("			")
print ("""If value is unknown, type "?" """)
print ("			")		

while True:
	try:
		R = input("Resistence = ")
		U = input("Voltage = ")
		I = input("Current = ")
		print(" ")
		if R == "?":
			R = float(U)/float(I)
			print("Resistence is:",  R ,"Ω")
		elif U =="?":
			U = float(R)*float(I)
			print("Voltage is:", U ,"V")
		elif I =="?":
			I = float(U)/float(R)
			print("Current is:", I ,"A")
		P = float(U)*float(I)
		print("Perfomance is:",P,"W")
	except ValueError as verr:
            print(verr)
            continue
	break

eoc()
