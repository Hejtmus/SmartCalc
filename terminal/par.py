#!/usr/bin/python3

from definitions import eoc
from definitions import int_inpt
import math

o = input('Power or root? [p/r]')

if o == 'p' or o == 'P':
	pwr = 0
	while pwr == 0:
		try:
			bn = int_inpt('Basic number = ')
			ss = int_inpt('Superscript = ')
			pwr = bn ** ss
			print('Power =',pwr)
		except ValueError as verr:
			print(verr)
			continue
elif o == 'r' or o == 'R': #note - this is currently WIP
	root = 0
	while root == 0:
		try:
			rdc = int_inpt('Radical = ')
			ior = int_inpt('Index of root = ')
			for ior in rdc:
				root = math.sqrt(rdc)
			print('Root =',root)
		except ValueError as verr:
			print(verr)
			continue
