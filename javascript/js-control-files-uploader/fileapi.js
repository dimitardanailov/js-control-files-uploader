
/*
 * JS Control files uploadер
 * 
 * Copyright (c) Dimitar Danailov
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 */

$.fn.extend(
{
    file : function(config)
    {
        config = $(this).extendConfigarations(config);
        config = $(this).getFormInfo(config);
        
        $(this).bind(
        { 
            change : function()
            {
                var input = this,
                files = input.files;
                
                config = $(this).getResponseElement(config, true);
                
                if (config.upload)
                {
                    $(this).uploadFiles(config, input, files);
                }
                else
                {
                    if (config.events.preview)
                    {
                        $(this).loadListPreview(config, input, files);
                    }    
                }    
            }
        });
    },
    uploaderFileForm : function (config)
    {
        config = $(this).extendConfigarations(config);
        config.form = $(this);
        config.path = config.form.attr('action');
        
        if (config.inputFile)
        {
            var attributeName = config.inputFile.attr('name');
            var input = document.getElementsByName(attributeName)[0],
            files = input.files;
            
            config = $(this).getResponseElement(config, true);
            $(this).uploadFiles(config, input, files);
        }    
    },
    uploadFiles : function(config, input, files)
    {
        var formData = $(this).browserSupportFormData(config);
       
        if (formData)
        {
            $(this).fileApiTransportData(config, input, files, formData);
        }
        else
        {
            $(this).iframeTransportData(config);
        }
    },
    /**
     * formData will be used to send the images to the server if the browser supports that.
     * We initialize it to false and then check to see if the browser supports FormData;
     * If it does, we create a new FormData object.
     */
    browserSupportFormData : function ()
    {
        var formData = false;

        if (window.FormData)
        {
            formData = new FormData();
        }

        return formData;
    },
    browserSupportFileReader : function ()
    {
        var fileReader = false;
        
        if ( window.FileReader)
        {
            fileReader = true;
        }
        
        return fileReader;
    },
    iframeTransportData : function (config)
    {
        var date = new Date(),
        currentDateMilliseconds = date.getTime(),
        uploadTargetName = 'upload_target_' + currentDateMilliseconds;

        var iframe = document.createElement('iframe');
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.name = uploadTargetName;
        iframe.src = config.path;
        iframe.id = 'upload_iframe_' + currentDateMilliseconds;

        config = $(this).addFormId(config);

        var form = document.getElementById(config.form.id);
        form.appendChild(iframe);

        form.target = uploadTargetName;
        form.action = config.path;
        
        if (config.upload)
        {    
            form.submit(function(event)
            {
                $(this).stopBubblingPhase(event);
            }); 
            
            $('#' + iframe.id).readIframeContent(config);
        }
    },
    readIframeContent : function (config)
    {
        $(this).bind(
        {
            load : function()
            {
                var content = $(this).contents().find('body').html();
                
                $(this).loadJSONResponse(config, content, true);
            }
        });
    },
    fileApiTransportData : function (config, input, files, formData)
    {
        var i = 0, len = files.length, countValidImages = 0, reader, file;
        config = $(this).updateConfiguration(config, input);
        
        for ( ; i < len; i++)
        {
            if (countValidImages < config.maximumFileCount)
            {    
                file = files[i];
                var matcher = config.regExp.test(file.type);

                if (matcher)
                {
                    if (file.size <= config.maximumFileSize.bytes)
                    {
                        if (config.events.preview)
                        {
                            $(this).readFileInformation(config, reader, file);
                        }    

                        formData.append(config.attributeName, file);
                    } 
                    else
                    {
                        $(this).generateInvalidFileSizeMessage(config, file.name);
                        countValidImages--;
                    }     
                }
                else
                {
                    $(this).generateInvalidFileTypeMessage(config, file.name);
                    countValidImages--;
                }
            }
            countValidImages++;
        }

        if (formData)
        {
            $(this).sendAjaxRequest(config, formData);
        }
    },
    sendAjaxRequest : function(config, formData)
    {
        var xhr = new XMLHttpRequest();
        if (!config.loadAjaxLoader)
        {
            xhr.upload.addEventListener('progress', 
                function(event){
                    $(this).uploadProgress(config, event);
                }, false);
        }
        else
        {
            xhr.upload.addEventListener('progress', 
                function(event){
                    $(this).loadAjaxLoader(config, event);
                }, false);
        }
        
        xhr.addEventListener('abort', function(){
            $(this).uploadAbort();
        }, false);
        xhr.open('POST', config.path);
        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState === 4)
            {
                if (xhr.status === 200)
                {
                    if (config.customfunction)
                    {
                        config.customfunction();
                    }
                    else
                    {
                        $(this).uploadComplete(config, xhr);
                    }    
                    
                }
                else
                {
                    $(this).uploadFailed(config, xhr);
                }
            }
        };
        xhr.send(formData);
    },
    uploadProgress : function (config, event)
    {
        if (event.lengthComputable)
        {
            var percentComplete = Math.round(event.loaded * 100 / event.total);

            if (config.responseElement)
            {   
                var progressBar = {
                    'responseElement' : config.responseElement, 
                    'percentComplete' : percentComplete + '%'
                    };
                $(this).loadProgressbar(progressBar);
            }
        }
        else
        {
            if (config.responseElement)
            {
                $(config.responseElement).append('unable to compute');
            }
        }
    },
    loadAjaxLoader: function(confing, event)
    {
        var loaderContainer = document.getElementById(confing.loadAjaxLoader.element);
        
        if (event.lengthComputable)
        {
            var percentComplete = Math.round(event.loaded * 100 / event.total);
            
            if (percentComplete < 100)
            {
                loaderContainer.innerHTML = confing.loadAjaxLoader.loader;
                loaderContainer.className = '';
            }   
            else
            {
                loaderContainer.innerHTML = '';
            }
            
        }
    },
    uploadComplete : function (config, response)
    {
        if (config.responseElement)
        {
            var progressBar = {
                'responseElement' : config.responseElement, 
                'percentComplete' : 100 + '%'
            };
            $(this).loadProgressbar(progressBar);
            
            if (config.events.reload && config.events.reload.type && config.events.preview.listContainer)
            {
                var type = config.events.reload.type;
                
                switch(type)
                {
                    case 'html':
                        $('#album-list ul').html(response.responseText);
                        break;
                }
            }        
        }
    },
    uploadFailed  : function (config, error)
    {
        var progressBarContainer = document.getElementById('_fileapiprogressbar_');
        if (progressBarContainer)
        {
            progressBarContainer.innerHTML = '';
        }    
        
        var message = $(this).getServerErrorMessage(error);

        $(this).printServerErrorMessage(config.responseElement, message);
    },
    uploadAbort : function()
    {
        alert(ajaxMessages.abortOperations);
    },
    loadProgressbar : function (progressBar)
    {
        progressBar.id = '_fileapiprogressbar_';
        var progressBarContainer = document.getElementById(progressBar.id);
        
        if (progressBarContainer)
        {
            $(this).updateProgressbar(progressBar);
        }
        else
        {
            $(this).createProgressbar(progressBar);
        }    
    },
    createProgressbar : function (progressBar)
    {
        var progressBarContainer = document.createElement('div');
        progressBarContainer.id = progressBar.id;
        
        var message = document.createElement('span');
        message.innerHTML = ajaxMessages.completed + ' : ';
        var percentContainer = document.createElement('span');
        percentContainer.innerHTML = progressBar.percentComplete ;
        message.appendChild(percentContainer);
        progressBarContainer.appendChild(message);
        
        var graphicalprogressBar = document.createElement('div');
        graphicalprogressBar.style.width = progressBar.percentComplete;
        graphicalprogressBar.setAttribute('class', 'progressbar');
        progressBarContainer.appendChild(graphicalprogressBar);
        
        progressBar.responseElement.appendChild(progressBarContainer);
    },
    updateProgressbar : function (progressBar)
    {
        var progressBarContainer = document.getElementById(progressBar.id);
        
        progressBarContainer.firstChild.lastChild.innerHTML = progressBar.percentComplete;
        progressBarContainer.lastChild.style.width = progressBar.percentComplete;  
    },
    loadJSONResponse : function (config, jsonMessage, resetContent)
    {
        var serverInfo = jQuery.parseJSON(jsonMessage);

        if (serverInfo.HTTPCODE == 200)
        {
            if (config.responseElement)
            {
                var lenght = serverInfo.elements.length;
                var htmlElement = config.responseElement;

                if (resetContent)
                {
                    htmlElement.innerHTML = '';
                }

                for (var i = 0; i < lenght; i++)
                {
                    var element = serverInfo.elements[i];
                    var tag = $(this).createHtmlTag(element);

                    if (element.children)
                    {
                        var childrenLenght = element.children.length;

                        for (var j = 0; j < childrenLenght; j++)
                        {
                            var child = element.children[j];
                            var childrenTag = $(this).createHtmlTag(child);

                            tag.appendChild(childrenTag);
                        }
                    }

                    htmlElement.appendChild(tag);
                }
            }
        }
        else
        {
            var message = serverInfo.message;
            $(this).printServerErrorMessage(config.responseElement, message);
        }
    },
    createHtmlTag : function (element)
    {
        var tagName = element.tagName;
        var tag = document.createElement(tagName);
        var value = null;

        if (element.text)
        {
            tag.innerHTML = element.text;
        }

        for (var attributte in element.attributes)
        {
            value = element.attributes[attributte];
            tag.setAttribute(attributte, value);
        }

        return tag;
    },
    getServerErrorMessage : function (error)
    {
        var message = null;

        if (error.responseText)
        {
            var serverInfo = jQuery.parseJSON(error.responseText);
            message = serverInfo.message;
        }
        else
        {
            message = ajaxMessages.checkInternetConnection;
        }

        return message;
    },
    generateInvalidFileSizeMessage: function (config, fileName)
    {
        var errorMessage = fileName + ' ' + ajaxMessages.isToBig + '. ' + ajaxMessages.invalidPictureSize + 
        config.maximumFileSize.value + ' ' +config.maximumFileSize.type + '.';
        $(this).printServerErrorMessage(config.responseElement, errorMessage);  
    },
    generateInvalidFileTypeMessage: function (config, fileName)
    {
        var errorMessage = fileName + ' ' + ajaxMessages.invalidFileType + '. ';
        $(this).printServerErrorMessage(config.responseElement, errorMessage);  
    },        
    printServerErrorMessage : function (responseElement, message)
    {
        if (responseElement)
        {
            var tag = document.createElement('div');  
            tag.setAttribute('class', 'colorError')
            tag.innerHTML = message;
            responseElement.appendChild(tag);
        }
        else
        {
            alert(message);
        }
    },
    stopBubblingPhase : function (event)
    {
        if (!event) event = window.event;
        event.cancelBubble = true;
        if (event.stopPropagation) event.stopPropagation();
    },
    addFormId : function (config)
    {
        if (config.form.attr('id'))
        {
            config.form.id = config.form.attr('id');
        }
        else
        {
            var date = new Date(),
            currentDateMilliseconds = date.getTime(),
            formId = '_fileapiform_' + currentDateMilliseconds;
            config.form.id = formId;

            config.form.attr('id', formId);
        }
        
        return config;
    },
    loadListPreview : function (config, input, files)
    {
        if (input.addEventListener)
        {
            var i = 0, countValidImages = 0, len = files.length, reader, file;
            config = $(this).updateConfiguration(config, input);
            
            for ( ; i < len; i++)
            {
                if (countValidImages < config.maximumFileCount)
                {    
                    file = files[i];
                    var matcher = config.regExp.test(file.type);
                    
                    if (matcher)
                    {
                        if (file.size <= config.maximumFileSize.bytes)
                        {
                            $(this).readFileInformation(config, reader, file);
                        } 
                        else
                        {
                            $(this).generateInvalidFileSizeMessage(config, file.name);
                            countValidImages--;
                        }     
                    }
                    else
                    {
                        $(this).generateInvalidFileTypeMessage(config, file.name);
                        countValidImages--;
                    }
                }   
                
                countValidImages++;
            }
        }
    },
    readFileInformation : function (config, reader, file)
    {
        if (config.fileReader)
        {
            reader = new FileReader();
            reader.onloadend = function (e)
            {
                $(this).showUploadedItem(config, e.target.result, file.fileName);
            };
            reader.readAsDataURL(file);
        }
    },
    updateConfiguration : function (config, input)
    {
        config = $(this).calculateMaximumFileSize(config),
        config.attributeName = input.getAttribute('name'),
        config.regExp= new RegExp(config.validFileTypes, 'i');

        config = $(this).updatePreviewCharacteristics(config);      
        
        return config;
    },
    updatePreviewCharacteristics : function (config)
    {
        var fileReader = $(this).browserSupportFileReader();
        config.fileReader = fileReader;
        
        if (config.fileReader)
        {    
            if (config.events.preview && config.events.preview.fileContainer)
            {
                var prieviewFileContainer = document.getElementById(config.events.preview.fileContainer),
                childNodesLenght = prieviewFileContainer.childNodes.length,
                list = null;
                    
                if (childNodesLenght <= 1)
                {
                    list = document.createElement('ul');
                    prieviewFileContainer.appendChild(list);
                }
                else
                {
                    list = prieviewFileContainer.childNodes[1];
                    $(this).removeItemsByClassName(list, config.listItemClass);
                }    
                
                config.events.preview.listContainer = list;
            }
        }
        
        return config;
    },
    removeItemsByClassName : function (item, classNameCriteria)
    {
        var children = item.childNodes, i=0, child, criteriaElements = [], length = children.length;
        
        for (; i < length; i++)
        {
            if (children[i])
            {    
                child = children[i];

                if (child.className == classNameCriteria)
                {
                    criteriaElements.push(child);
                }
            }
        }
        
        length = criteriaElements.length;
        
        if (length > 0)
        {
            i = 0;
            for (; i < length; i++)
            {
                item.removeChild(criteriaElements[i]);
            }
        }    
            
    },
    showUploadedItem : function(config, source)
    {
        var list = config.events.preview.listContainer,
        li   = document.createElement("li"),
        img  = document.createElement("img");
        
        li.setAttribute('class', config.listItemClass);
        img.src = source;
        
        if (config.events.preview.width)
        {
            img.width = config.events.preview.width;
        }    
        
        li.appendChild(img);
        list.appendChild(li);
    },
    calculateMaximumFileSize : function (config)
    {
        var bytes = 1;
        
        switch(config.maximumFileSize.type)
        {
            case 'kb':
                bytes = 1024;
                break;
            case 'mb':
                bytes = 1024 * 1024;
                break;
        }
        
        config.maximumFileSize.bytes = bytes * config.maximumFileSize.value;
        
        return config;
    },
    getResponseElement : function (config, resetResponseContent)
    {
        if (config.responseElement)
        {
            if (typeof(config.responseElement) === 'string')
            {
                config.responseElement = document.getElementById(config.responseElement);
            }    

            if (resetResponseContent)
            {
                config.responseElement.innerHTML = '';
            }
        }
        
        return config;
    }, 
    extendConfigarations : function (config)
    {
        config = $.extend({
            'upload' : true,
            'events' : {},
            'validFileTypes' : 'image.(jpeg|jpg|gif|png)',
            'maximumFileSize' : {
                'value' : 2, 
                'type' : 'mb'
            },
            'maximumFileCount' : 20,
            'listItemClass' : '_fileapi-list-view-item_'
        }, config);
        
        return config;
    },
    getFormInfo : function (config)
    {
        config.form = $(this).closest('form[enctype="multipart/form-data"]');

        if (!config.path)
        {
            config.path = config.form.attr('action');
        }
        
        return config;
    }
});

