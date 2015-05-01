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
	p = None
	t = None
	
	def create_account(self, uname):
		p1 = Popen("./create_account.sh " + uname, shell=True, bufsize=1, stdin=PIPE, stdout=PIPE)
		out, err = p1.communicate()
		
		if err is None:
			print "Account is created successfully."
			return True
			
		print err
		return False
		
		
	def opened(self):
	
		uname = "batu"
		
		if not os.path.isdir(uname):
			self.create_account(uname)
		
		penv = os.environ.copy()
		penv['HOME'] = '/home/' + uname

	
		self.master, self.s = pty.openpty()
		
#		fcntl.ioctl(0, termios.TIOCSCTTY, 1)
#		self.p = Popen(["bash", "-i"], bufsize=1, stdin=self.s, stdout=self.s, stderr=STDOUT, preexec_fn=child_init)
		self.p = Popen(["sudo", "login"], bufsize=1, stdin=self.s, stdout=self.s, stderr=STDOUT, preexec_fn=child_init)#, env=penv)
#		self.p = Popen(["bash", "-i"], bufsize=1, stdin=sys.stdin, stdout=sys.stdout, stderr=STDOUT, env=penv)
#		self.p = Popen("chroot " + uname + "/ bash", shell=True, bufsize=1, stdin=PIPE, stdout=PIPE, env=penv)
#		self.p.stdout = Unbuffered(self.p.stdout)				
	
		self.t = Thread(target=self.listen_stdout)
		self.t.daemon = True # thread dies with the program
		self.t.start()
		
	def received_message(self, message):
		sys.stdout.write(message.data)
		os.write(self.master, message.data)
				
	def closed(self, code, reason):
		pass
		#print("exit", file=self.p.stdin)
		#print("Socket closed %s %s" % (code, reason))
		
		    
	def listen_stdout(self):
		
		while True:
			c =  ord(os.read(self.master, 1))
			
			# calculate UTF-8 char length
			len = (1 if c>>7==0 else 2 if c>>5==6 else 3 if c>>4==14 else 4 if c>>3==30 else 5 if c>>2==62 else 6)
			
			# read UTF-8 chars
			s = ""
			while True:
				if c < 16:
					s += '%0' + str(hex(c))[2:]
				else:
					s += '%' + str(hex(c))[2:]
				
				len -= 1
				if not len:
					break;
					
				c = ord(os.read(self.master, 1))

			self.send(s)
	
def signal_handler(signal, frame):
        server.close()
        
signal.signal(signal.SIGINT, signal_handler)
		
server = WSGIServer(('144.122.71.77', 8080),
	                    WebSocketWSGIApplication(handler_cls=MyWebSocket))
	                
server.serve_forever()
