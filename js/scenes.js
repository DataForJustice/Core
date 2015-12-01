function Coordinator (conf) {
	this.conf = conf;
	this.map = null;
	this.scroll = null;
	this.currentScene = null;
	this.currentElement = null;
	this.dataOrder = [];

	this.data = {};

	this.init ();
	return this;
}
Coordinator.prototype = {
	constructor: Coordinator,
	init: function () {
		if (this.conf.data) {
			var q = queue ();
			for (c in this.conf.data) {
				var d = this.conf.data [c];
				q.defer (d.type, d.url)
				this.dataOrder.push (d.id);
			}
			q.await ($.proxy (this.dataCallback, this));
		}
	},
	dataCallback: function () {
		if (arguments.length > 0) {
			if (arguments [0]) throw arguments [0];
			for (var i = 1; i < arguments.length; i++) {
				var dataName = this.dataOrder [i-1];
				var conf = this.conf.data [dataName];
				if (conf) {
					var data = arguments [i];
					if (conf.processor) { 
						var ret = $.proxy (conf.processor, this) (arguments [i]);
						if (ret) { 
							data = ret;
						}
					}
					this.data [dataName] = data;
				}
			}
			this.initScroll ();
			this.initMap ();
			this.initText ();
			this.initControls ();
		}
	},
	scrollProgress: function (scene) {
		/*
		var zoomTo = $(scene).data ("zoom_to");
		var zoomLevel = $(scene).data ("zoom_level");
		if (zoomTo) {
			if (!zoomLevel) zoomLevel = 140;
			this.map.zoomTo ("#" + zoomTo, zoomLevel);
		}
		*/
	},
	scrollLeave: function (scene) {
	},
	scrollEnter: function (element) {
		$(element).siblings ().removeClass ("highlight");
		$(element).addClass ("highlight");
		if (element && element.id) {
			if (element.id != this.currentElement) {
				var clear = $(element).data ("clear");
				if (clear) {
					var layers = clear.split(',');
					for (var l in layers) {
						this.quantify (layers [l.trim()]);
					}
				}
				var section = $(element).data ("section");
				$(".text_container").children ("[data-section]").hide ();
				$("li[data-section]").removeClass ("highlight");
				var labeler;
				if (section) {
					$(".text_container").children ("[data-section='" + section + "']").show ();
					$("li[data-section='" + section + "']").addClass ("highlight");
					var txt = $("li[data-section='" + section + "']").first ().text ();
					$(".text_container .section_name").text (txt);
					if (this.conf.labelers && this.conf.labelers [section]) {
						labeler = this.conf.labelers [section];	
					}
				}
				var quantify = $(element).data ("quantify");
				var quantifier = $(element).data ("quantifier");
				if (quantify && quantifier) {
					if (labeler && quantify == labeler.layer) {
						this.quantify (quantify, quantifier, labeler.labeler);
					} else if (labeler) {
						this.quantify (labeler.layer, quantifier, labeler.labeler);
					} else {
						this.quantify (quantify, quantifier);
					}
				}
				var zoomTo = $(element).data ("zoom_to");
				var zoomLevel = $(element).data ("zoom_level"); 
				if (!zoomTo) {
					zoomTo = $(element).prev ().data ("zoom_to"); 
					zoomLevel = $(element).prev ().data ("zoom_level");
				}
				if (zoomTo) {
					this.map.zoomTo ("#" + zoomTo, zoomLevel);
				}

				this.currentElement = element.id;
			}
		}
	},
	quantify: function (layer, quantifier, labeler) {
		var q = quantifier ? this.conf.quantifiers [quantifier] : null;
		var l = this.conf.data [layer];
		if (!q && quantifier) throw "No quantifier found: " + quantifier;
		if (!l) throw "No data found: " + layer;
		this.map.topologies [layer].redraw (this.setFeatureId (l), $.proxy (q, this), $.proxy (labeler, this));
	},
	setFeatureId: function (layer) {
		return function (x) { 
			var val = x.properties [layer.idProperty];
			if (typeof layer.idProperty === "function") {
				val = layer.idProperty (x); 
			}
			return layer.id + "_" + val;
		};
	},
	initControls: function () {
		$("a[data-control]").click ({me: this}, 
			function (a) { 
				var x = a.data.me;
				var zoomTo = $(this).data("zoom_to"); 
				var zoomLevel = $(this).data ("zoom_level");
				if (zoomTo) {
					x.map.zoomTo ("#" + zoomTo, zoomLevel);
				}
			}
		);
	},
	initMap: function () { 
		this.map = new Mapify ("#map", $(window).width (), $(window).height ())
		this.map.setCenter (this.conf.map.center);
		for (var i in this.conf.map.layers) {
			var l = this.conf.data [this.conf.map.layers [i]];
			this.map.addFeatures (l.id, this.data [l.id], l.key); 
			this.map.topologies [l.id].redraw (this.setFeatureId (l));
		}
	},
	initScroll: function () {
		this.scroll = new Scenify ("#movie");
		this.scroll.on ("scene_progress", $.proxy (this.scrollProgress, this));
		this.scroll.on ("scene_enter", $.proxy (this.scrollEnter, this));
		this.scroll.on ("scene_leave", $.proxy (this.scrollLeave, this));
	},
	initText: function () {
		$("#text_container").children ().hide ();
	}
};
function Scenify (selector) {
	this.selector = selector;
	this.controller = new ScrollMagic.Controller ();
	this.callbacks = {
		scene: { progress: [], enter: [], leave: [] }
	};
	this.scenes = [];
	this.highlightedElements = {};
	this.init ();
	return this;
}
Scenify.prototype = {
	constructor: Scenify,
	init: function () {
		$(this.selector).children ().each ($.proxy (function (index, child) {
			var hook = 0;
			var sceneElement = $(child);
			var scene = new ScrollMagic.Scene ({triggerElement: child, tweenChanges: true, duration: "100%"})
					.triggerHook (hook)
					.addTo (this.controller);
			$(sceneElement).css ("border-bottom", "1px solid black")
				.html (function () { 
					return "Lorem ipsum dolor sit amet, ex prompta laoreet usu, ut quas invidunt duo. Alii aperiri eos et, imperdiet repudiare ne has. At mutat fuisset probatus eum, mea dicunt fuisset menandri ei, gloriatur sadipscing nec id. Vix id impetus maiorum, praesent ocurreret ne eum, his cu illud delenit sapientem. Eu vis audiam option postulant, cu eum congue bonorum, pri erant ubique ad. Ferri postulant quo an, ius te tota nonumes appellantur.<br>In pro tibique intellegat, ius posse dicat in, in audire partiendo has. Nam eius augue philosophia in. Ei sed sint soleat, vel lorem tibique eu, in vix molestiae efficiendi accommodare. Mutat nostro et his, recteque urbanitas ad nec. Alii postea mea eu, at quis nisl postea cum, quo id adhuc adversarium.<br>Qui idque atomorum id, in minim moderatius mel. Quo ullum dissentias at. Eam ut putent volutpat constituto, odio latine vim ex. Ex cum unum debitis. Te sea elitr clita erroribus, nisl veri sit at. Prompta debitis deleniti cu quo, veri dolor aliquip per id.<br>An vis torquatos efficiendi. Duo atqui nominati euripidis an. Congue deleniti repudiare mel ut, eu probo antiopam ius. Scripta malorum epicuri ea duo. Ius summo commodo scriptorem ei, vis ne congue vivendo.";
				});

			scene.on ("enter", $.proxy (this.enterCallback, this));
			scene.on ("leave", $.proxy (this.leaveCallback, this));
			scene.on ("progress", $.proxy (this.progressCallback, this));

			this.scenes.push (scene);
		}, this));
		return this;
	},
	progressCallback: function (ev) { 
		var elm = ev.target.triggerElement ();
		console.log (ev);
		this.trigger ("scene_progress", [elm]);
	},
	enterCallback: function (ev) { 
		var elm = ev.target.triggerElement ();
		this.trigger ("scene_enter", [elm]);

	},
	leaveCallback: function (ev) {
		var elm = ev.target.triggerElement ();
		this.trigger ("scene_leave", [elm]);

	},
	trigger: function (eventName, args) {
		for (c in this.callbacks [eventName]) {
			var cb = this.callbacks [eventName] [c];
			cb.apply (this, args);
		}
	},
	on: function (eventName, callback) {
		if (!this.callbacks [eventName]) this.callbacks [eventName] = [];
		this.callbacks [eventName].push (callback);
		return this;
	}

};

