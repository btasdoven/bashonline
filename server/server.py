from ws4py.server.geventserver import WSGIServer
from ws4py.websocket import WebSocket
from ws4py.server.wsgiutils import WebSocketWSGIApplication
from subprocess import Popen, PIPE, STDOUT, call
from threading import Thread
from Queue import Queue, Empty

import time, os, sys, re, signal
import pty, fcntl, termios

def child_init():
	os.setsid()
	
class MyWebSocket(WebSocket):
		
	"""
	def create_account(self, uname):
		p1 = Popen("./create_account.sh " + uname, shell=True, bufsize=1, stdin=PIPE, stdout=PIPE)
		out, err = p1.communicate()
		
		if err is None:
			print "Account is created successfully."
			return True
			
		print err
		return False
		
	def start_instance(self):		
		self.master, slave = pty.openpty()
		
		print "Initialized. tty:", os.ttyname(slave)
		
		cmd = "sudo lxc-start -c %s -n %s" % (os.ttyname(slave), self.inst_name)
		p = Popen(cmd.split(), bufsize=1, stdin=slave, stdout=slave, stderr=STDOUT, preexec_fn=child_init)#, env=penv)
		
		t = Thread(target=self.listen_stdout)
		t.daemon = True # thread dies with the program
		t.start()
		
	def create_instance(self):
		global _inst
		_inst += 1
		self.inst_name = "bo%d" % _inst
		
		self.sendText("[%s] - Initializing...\r\n" % self.inst_name)
		print "[%s] - Initializing..." % self.inst_name,
		
		#cmd = "sudo lxc-create -t ubuntu -n %s -- -u guest --password guest" % inst_name
		cmd = "sudo lxc-clone -H -o deneme -n %s" % self.inst_name
		process = Popen(cmd.split(), stdout=PIPE)
		output = process.communicate()[0]
		
		call(["sed", "-i", "s/deneme/%s/" % self.inst_name, "/var/lib/lxc/%s/fstab" % self.inst_name])
	"""	
				
		
	def opened(self):		
		global _inst
		_inst += 1
		self.log = ""

		self.master, slave = pty.openpty()
		self.inst_name = "bo%d" % _inst
		
		print "Initialized. tty: %s, inst_name: %s" % (os.ttyname(slave), self.inst_name)
		
		cmd = "sudo ./start.sh %s %s" % (os.ttyname(slave), self.inst_name)
		p = Popen(cmd.split(), bufsize=1, stdin=slave, stdout=slave, stderr=STDOUT, preexec_fn=child_init)#, env=penv)
		
		#listen 'master fd' in a separate thread
		t = Thread(target=self.listen_stdout)
		t.daemon = True # thread dies with the program
		t.start()
				
				
	def closed(self, code, reason):
		print "[%s] - Exiting with code (%s, %s)... " % (self.inst_name, code, reason),
		f = open('log/' + self.inst_name, 'w')
		#print "--", self.log, "--"
		f.write(self.log)
		f.close()

		cmd = "sudo ./stop.sh %s" % self.inst_name
		process = Popen(cmd.split(), stdout=PIPE)
		output = process.communicate()[0]
		print "stopped and destroyed."


	def received_message(self, message):
#		sys.stdout.write(message.data)
#		if len(message.data) >= 3 and message.data[0:3] == "\x1b\x5c\x5c":
#			print "special message to the server"
		os.write(self.master, message.data)
					    
					    
	def listen_stdout(self):
		
		while True:
			c =  ord(os.read(self.master, 1))
			self.log += chr(c)

			# calculate UTF-8 char length
			l = (1 if c>>7==0 else 2 if c>>5==6 else 3 if c>>4==14 else 4 if c>>3==30 else 5 if c>>2==62 else 6)
			
			# read UTF-8 chars
			s = ""
			while True:
				# e.g. c=32 -> s='%20', c=12 -> s='%0C'
				s += '%%%.2X' % c
				l -= 1
				if not l:
					break;
					
				c = ord(os.read(self.master, 1))

			self.send(s)
	
	
	def sendText(self, text):
		text_len = len(text)
		i = 0
		while i < text_len:
			c = ord(text[i])
			i += 1
			
			l = (1 if c>>7==0 else 2 if c>>5==6 else 3 if c>>4==14 else 4 if c>>3==30 else 5 if c>>2==62 else 6)
			
			# read UTF-8 chars
			s = ""
			while True:
				# e.g. c=32 -> s='%20', c=12 -> s='%0C'
				s += '%%%.2X' % c				
				l -= 1
				if not l:
					break;
					
				c = ord(text[i])
				i += 1

			self.send(s)
			
			
def signal_handler(signal, frame):
	print "closing..."
	server.close()
	sys.exit()
        
        
_inst = 1001
signal.signal(signal.SIGINT, signal_handler)

server = WSGIServer(('144.122.71.77', int(sys.argv[1])),
	                    WebSocketWSGIApplication(handler_cls=MyWebSocket))         
server.serve_forever()
