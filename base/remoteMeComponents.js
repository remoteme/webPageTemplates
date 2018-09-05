
var id=0;
var otChange= new OperationTimer(200);



function readProperties(selector){
	var name = $(selector).attr("name");
	if ($(selector).attr("label") != undefined) {
		label = $(selector).attr("label");
	} else {
		label = prop.name;
	}

	if ($(selector).attr("disabled") != undefined) {
		disabled=true;
	}else{
		disabled=false;
	}

	var min=0;
	var max=100;
	if ($(selector).attr( "min" )!=undefined){
		min=$(selector).attr( "min" );
	}
	if ($(selector).attr( "max" )!=undefined){
		max=$(selector).attr( "max" );
	}
	var disabled=false;
	disabled =$(selector).attr( "disabled" )!=undefined;

	return {name:name,label:label,disabled:disabled,min:min,max:max,disabled:disabled};


}
function addButton(selector){
	var prop = readProperties(selector);

	var element = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect" ${prop.disabled?'disabled':''}>${prop.label}	</button>`);

	remoteme.getVariables().observeBoolean(prop.name,x=>{
		if (x){
			$(element).addClass("mdl-button--accent");
		}else{
			$(element).removeClass("mdl-button--accent");
		}
	});

	$(element).click(()=>{
		var value=!$(element).hasClass("mdl-button--accent");
		remoteme.getVariables().setBoolean(prop.name,value);
	});
	$(selector).append(element);
	componentHandler.upgradeElement(	element.get()[0]);
}


function addColorChange(selector){

	var prop = readProperties(selector);


	var dialog = $(`<dialog class="mdl-dialog">
		<div class="mdl-dialog__content">
		  <div class="wheelDemoWrapper"> </div>
		</div>
		<div class="mdl-dialog__actions">
		  <button type="button" class="mdl-button select">Select</button>
		  <button type="button" class="mdl-button close">Cancel</button>
		</div>
  </dialog>`);


	var newVar = dialog.find('.wheelDemoWrapper').get(0);
	var colorPicker = new iro.ColorPicker(newVar, {

		markerRadius: 8,
		borderWidth: 2,
		borderColor: "#fff",
		width: 230,
		height: 290,
		anticlockwise: true,
		color:'#000000'
	});

	$(dialog.find('.select').get(0)).click(()=>{
		button.children(".color-badge").css("background-color", colorPicker.color.hexString);

		remoteme.getVariables().setSmallInteger3(prop.name,colorPicker.color.rgb.r,colorPicker.color.rgb.g,colorPicker.color.rgb.b);

		dialog.get()[0].close();
	});

	$(dialog.find('.close').get(0)).click(()=>{

		dialog.get()[0].close();
	});

	$(selector).append(dialog);
	componentHandler.upgradeElement(	dialog.get()[0]);

	if (! dialog.get()[0].showModal) {
		dialogPolyfill.registerDialog(get()[0]);
	}





	var button = $(`<button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect color-badge-parent"><span  class="color-badge"></span> ${prop.label}	</button>`);

	$(button).click(()=>{
		dialog.get()[0].showModal();
	});


	remoteme.getVariables().observeSmallInteger3(prop.name,(r,g,b)=>{
		if (colorPicker.color!=undefined){
			colorPicker.color.rgb = { r: r, g: g, b: b };
		}

		button.children(".color-badge").css("background-color", `rgb(${r}, ${g}, ${b})`);
	});




	$(selector).append(button);

	componentHandler.upgradeElement(	button.get()[0]);

}

function addCheckBox(selector,switchMode=false){
	var prop = readProperties(selector);

	var temp=id++;
	var checkBoxElement;
	if (switchMode){
		checkBoxElement = $(`<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${temp}">
			<input type="checkbox" id="switch-${temp}" class="mdl-switch__input" ${prop.disabled?'disabled':''}>
			<span class="mdl-switch__label">${prop.label}</span>
			</label>`);
	}else{
		checkBoxElement = $(`
		<label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="checkbox-${temp}">
		  <input type="checkbox" id="checkbox-${temp}" class="mdl-checkbox__input" ${prop.disabled?'disabled':''}>
		  <span class="mdl-checkbox__label">${prop.label}</span>
		</label>
	`);
	}




	var checkbox=checkBoxElement.find("input");


	checkbox.change(function() {
		remoteme.getVariables().setBoolean(prop.name,!checkBoxElement.is('.is-checked'));

	});

	remoteme.getVariables().observeBoolean(prop.name,x=>{
		if (switchMode){
			if (x){
				checkBoxElement.get()[0].MaterialSwitch.on();
			}else{
				checkBoxElement.get()[0].MaterialSwitch.off();
			}
		}else{
			if (x){
				checkBoxElement.get()[0].MaterialCheckbox.check();
			}else{
				checkBoxElement.get()[0].MaterialCheckbox.uncheck();
			}

		}

	});



	$(selector).append(checkBoxElement);
	componentHandler.upgradeElement(checkBoxElement.get()[0]);
}


function addSlider(selector,switchMode=false){

	var prop=readProperties(selector);

	var slider = $(`<input class="mdl-slider mdl-js-slider" type="range"
	min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);


	slider.on('input',function() {
		otChange.execute(()=>{
			remoteme.getVariables().setInteger(prop.name,slider.val());
		});

	});

	remoteme.getVariables().observeInteger(prop.name,x=>{
		slider.val(x);

	});


	$(selector).append(slider);
	componentHandler.upgradeElement(slider.get()[0]);
}

function add3Sliders(selector){




	var prop = readProperties(selector);

	var box= $(`<div class="box"></div>`);
	var sliders=[];


	sliders[0] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[1] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[2] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);



	var onChange =(()=> {
		otChange.execute(()=>{
			remoteme.getVariables().setSmallInteger3(prop.name,sliders[0].val(),sliders[1].val(),sliders[2].val());
		});

	});


	for(var i=0;i<3;i++){
		box.append(sliders[i]);
		sliders[i].on('input',onChange);
	}




	remoteme.getVariables().observeSmallInteger3(prop.name,(x1,x2,x3)=>{
		sliders[0].val(x1);
		sliders[1].val(x2);
		sliders[2].val(x3);
	});


	$(selector).append(box);



	for(var i=0;i<3;i++){
		componentHandler.upgradeElement(	sliders[i].get()[0]);

	}
}

function add2Sliders(selector){


	var prop = readProperties(selector);


	var box= $(`<div class="box"><p>${prop.label}</p></div>`);
	var sliders=[];


	sliders[0] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);
	sliders[1] = $(`<input class="mdl-slider mdl-js-slider" type="range" min="${prop.min}" max="${prop.max}" value="0" tabindex="0" ${prop.disabled?'disabled':''}>`);



	var onChange =(()=> {
		otChange.execute(()=>{
			remoteme.getVariables().setSmallInteger2(prop.name,sliders[0].val(),sliders[1].val());
		});

	});


	for(var i=0;i<2;i++){
		box.append(sliders[i]);
		sliders[i].on('input',onChange);
	}




	remoteme.getVariables().observeSmallInteger2(prop.name,(x1,x2)=>{
		sliders[0].val(x1);
		sliders[1].val(x2);
	});


	$(selector).append(box);

	for(var i=0;i<2;i++){
		componentHandler.upgradeElement(	sliders[i].get()[0]);

	}
}


function addGauge(selector){




	var prop = readProperties(selector);


	height=$(selector).attr( "height" );
	width=$(selector).attr( "width" );

	var canvas= $(`<canvas ></canvas>`);


	$(selector).append(canvas);

	var gauge = new RadialGauge({
		renderTo: canvas.get()[0],
		width: 300,
		height: 300,
		units: label,
		minValue: prop.min,
		maxValue: prop.max,
		//majorTicks: ticks,
		minorTicks: 2,
		strokeTicks: true,
		highlights: [

		],
		colorPlate: "#fff",
		borderShadowWidth: 0,
		borders: false,
		needleType: "arrow",
		needleWidth: 2,
		needleCircleSize: 7,
		needleCircleOuter: true,
		needleCircleInner: false,
		animationDuration: -1,
		animationRule: "linear"
	}).draw();



	remoteme.getVariables().observeInteger(prop.name,x=>{
		gauge.value=x;

	});
	$(canvas).css("width:100%;height:inherit,font-size:10px")

}
function addList(selector,variableType){

	var prop = readProperties(selector);


	var temp=id++;
	var element= $(`<div class="mdl-textfield mdl-js-textfield getmdl-select ${prop.disabled?'disabled':''}">
			<input type="text" value="" class="mdl-textfield__input" id="select${temp}" readonly>
			<input type="hidden" value="" name="select${temp}" class="value">
			<i class="mdl-icon-toggle__label material-icons">keyboard_arrow_down</i>
			<label for="select${temp}" class="mdl-textfield__label">${prop.label}</label>
			<ul for="select${temp}" class="mdl-menu mdl-menu--bottom-left mdl-js-menu" >
				
			</ul>
		</div>`);

	var ul=element.find('ul').get(0);
	if (prop.disabled){
		$(ul).css("display","none");
	}

	var toInsert = $(selector).find("option");
	for(var i=0;i<toInsert.length;i++){
		var label=$(toInsert[i]).html();
		var val=$(toInsert[i]).attr('value');
		console.log(label+" "+val);
		toInsert.remove();
		$(ul).append($(`<li class="mdl-menu__item" data-val="${val}">${label}</li>`));
	}
	element.get()[0].disabled=prop.disabled;

	element.get()[0].onChange=(val)=>{
		remoteme.getVariables().set(prop.name,variableType,[val]);
	};



	remoteme.getVariables().observe(prop.name,variableType,x=>{
		element.get()[0].set(x);
	});






	$(selector).append(element);
	componentHandler.upgradeElement(element.get()[0]);


}


function addRadios(selector,variableType) {


	var prop = readProperties(selector);



	var box = $(`<div class="box"><p>${prop.label}</p></div>`);
	var radios = [];


	var temp=id++;
	var toInsert = $(selector).find("option");
	var elements=[];
	for(var i=0;i<toInsert.length;i++){
		var label=$(toInsert[i]).html();
		var val=$(toInsert[i]).attr('value');

		toInsert.remove();

		var toInsertElement = $(`<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" for="${temp}-option-${val}" >
					  <input type="radio" id="${temp}-option-${val}" class="mdl-radio__button" name="options${temp}" value="${val}" ${prop.disabled?'disabled':''}>
					  <span class="mdl-radio__label">${label}</span>
					</label>`);

		var checkboxZ=toInsertElement.find("input");

		checkboxZ.change(function(s) {
			remoteme.getVariables().set(prop.name,variableType,[$(s.currentTarget).attr("value")]);
		});
		box.append(toInsertElement);
		elements[val]=(toInsertElement);


	}


	remoteme.getVariables().observe(prop.name,variableType,x=>{
		if (elements[x]!=undefined){
			$(elements[x])[0].MaterialRadio.check();
		}
	});


	$(selector).append(box);


}


function addTextField(selector,variableType) {



	var prop = readProperties(selector);

	var label;


	var temp=id++;

	var pattern=undefined;

	if (variableType==VariableOberverType.INTEGER){
		pattern="-?[0-9]*"
	}else if (variableType==VariableOberverType.DOUBLE){
		pattern="-?[0-9]*(\.[0-9]+)?"
	}else {
		pattern="*."
	}

	var textField = $(`<div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label textWithApply ${prop.disabled?'disabled':''}">
			<input class="mdl-textfield__input" type="text" id="textField-${temp}" pattern="${pattern}" ${prop.disabled?'disabled':''}>
			<label class="material-icons" for="textField-${temp}">publish</label>
			<label class="mdl-textfield__label" for="textField-${temp}">${prop.label}</label>
		</div>`);



	var input = $(textField).find("input");
	var button = $(textField).find(".material-icons");

	input.keypress(function (e) {
		if (e.which == 13) {
			remoteme.getVariables().set(prop.name,variableType,[input[0].value]);
			return false;
		}
	});

	button.click(()=>{
		remoteme.getVariables().set(prop.name,variableType,[input[0].value]);
	});


	remoteme.getVariables().observe(prop.name,variableType,x=>{
		textField[0].MaterialTextfield.change(x);
		textField.removeClass("is-upgraded");
	});


	$(selector).append(textField);


}



function replace(){
	var variables=$("variable");
	for(var i=0;i<variables.length;i++){
		variable=variables[i];
		if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="button"){
			addButton(variable);
		}else if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="checkbox"){
			addCheckBox(variable);
		}else if ($(variable).attr( "type" ) =="BOOLEAN" && $(variable).attr( "component" ) =="switch"){
			addCheckBox(variable,true);
		}else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="slider"){
			addSlider(variable);
		}else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="gauge"){
			addGauge(variable);
		}else if ($(variable).attr( "type" ) =="SMALL_INTEGER_3" && $(variable).attr( "component" ) =="sliders"){
			add3Sliders(variable);
		}else if ($(variable).attr( "type" ) =="SMALL_INTEGER_2" && $(variable).attr( "component" ) =="sliders"){
			add2Sliders(variable);
		}else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="list"){
			addList(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="list"){
			addList(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="list"){
			addList(variable,VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="radio"){
			addRadios(variable,VariableOberverType.DOUBLE);
		}


		else if ($(variable).attr( "type" ) =="INTEGER" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.INTEGER);
		}else if ($(variable).attr( "type" ) =="TEXT" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.TEXT);
		}else if ($(variable).attr( "type" ) =="DOUBLE" && $(variable).attr( "component" ) =="textField"){
			addTextField(variable,VariableOberverType.DOUBLE);
		}

		else if ($(variable).attr( "type" ) =="COLOR" ){
			addColorChange(variable);
		}
	}
}

$( document ).ready(function() {
	if (RemoteMe.thiz==undefined){
		remoteme = new RemoteMe();
	}
	replace();
});
