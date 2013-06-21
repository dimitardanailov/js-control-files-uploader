<h1>jQuery File uploader</h1>

<a href="http://js-control-files-uploader.itweb-projects.com/" target="_blank"
   title="Demo">Demo</a>

<div>
This plugin is based on : 
<ul>
    <li>
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/FormData" target="_blank"
           title="HTML 5 Javascript API - FormData">HTML 5 Javascript API - FormData</a>
        
    </li>
        
    <li>
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/FileReader" target="_blank"
           title="HTML 5 Javascript API - FormData">HTML 5 Javascript API - FileReader</a>
    </li>

    <li>
        For old browsers this plugin use iframe
    </li>
</ul>
</div>

<h2>Support</h2>

<div>Google Chrome 10+, Firefox 3+, Opera 8+, IE7+</div>

<h2>Instalation</h2>

<ul>
    <li>
        Include style/js-control-files-uploader.css
    </li>
    <li>
        Include jQuery
    </li>
    <li>
        Include javascript/i18n/{locale}.js
    </li>
    <li>
        Include javascript/js-control-files-uploader/fileapi.js
    </li>
</ul>

<h2>Instruction</h2>

<ul>
    <li>
        For multi upload use multiple attribute
    </li>

    <pre>
            $('input[type="file"]').file(
            {
                upload : true, /*** When input value is change files will be uploaded ***/
                path : 'uploader.php', /*** Path to Backend ***/
                maximumFileCount: 20, /*** How many files you can upload in one time ***/
                responseElement: 'responseelement', /*** id attribute of element for response ***/
                events : {
                    preview: {
                        'fileContainer' : 'preview-images', /*** id attribute of element for preview ***/
                        'width' : 124 /*** Width of each image ***/
                    }
                }
            });
    <pre>
</ul>
