all: http/img/polycule.svg http/json/spec.json http/legend.html

.PHONY: all clean 

http/json/spec.json: share/polycule.dot
	bin/mkspec share/polycule.dot > http/json/spec.json

http/legend.html: share/polycule.dot
	bin/mklegend share/polycule.dot > http/legend.html

http/img/polycule.svg: share/polycule.dot
	dot -Tsvg share/polycule.dot -o http/img/polycule.svg

clean:
	git clean -Xfd
