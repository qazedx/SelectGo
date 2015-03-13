if(!window.SelectGo){
  SelectGo = {};
}
SelectGo.Selector = {};

SelectGo.Selector.getSelected = function(){
  // Grab Selection
  var selection = window.getSelection();
  var text = selection.toString();
  var id = Math.random().toString(36).substring(7); // Creating random unique id
  return [text, id, selection];
}

SelectGo.Selector.mouseup = function(){
  var sel = SelectGo.Selector.getSelected();
  var text = sel[0];
  var id = sel[1];
  var selection = sel[2];

  // Check is not empty and not filled with whitespaces only
  if(text!='' && text.length > 1 && $.trim(text).length!=0){
    // Get current user defined status set in the storage
    chrome.storage.sync.get('selectStatus', function (obj) {

      // Then send the status and text to background
      chrome.runtime.sendMessage({
        status: obj.selectStatus,
        text: text,
        id: id
      });

      // Listen for calls from background. Specifically for option box
      chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if(request.type == "showOptionBox") {

            // Check if in range and then add node for popover
            if (selection && selection.rangeCount > 0){ // Add new node only if something is actually selected
              var range =  selection.getRangeAt(0);
              var newNode = document.createElement("span");
              newNode.setAttribute('id', id);
              //Insert node for the pop up
              range.insertNode(newNode);
              // Create unique content for each popover
              var content = '<img id="optionBoxCopy'+id+'" style="padding-right:10px" src="'+chrome.extension.getURL('img/copy.png')+'"/> <img id="optionBoxSearch'+id+'" src="'+chrome.extension.getURL('img/link.png')+'"/>';
              $('#'+id).webuiPopover({placement:'auto',content: content, width: 150, closeable:true, trigger: "click"});
            }

            // Fire up the popover
            $("#"+id).click();

            // Trigger copy action
            $("#optionBoxCopy"+id).click(function() {
              chrome.runtime.sendMessage({
                status: {"select": "clipboardOnly", "tab": obj.selectStatus["tab"]},
                text: text
              });
              disablePopup(id);
            });

            // Trigger Search action
            $("#optionBoxSearch"+id).click(function() {
              chrome.runtime.sendMessage({
                status: {"select": "searchOnly", "tab": obj.selectStatus["tab"]},
                text: text
              });
              disablePopup(id);
            });

            // As title suggests. Ignore
            $("#ignore").click(function() {
              disablePopup(id);
            });
          }
        });

    });
  }
}

//  Things to do with a document ready function
$(document).ready(function(){
  // Run the text selector on mouseup
  $(document).on("mouseup", SelectGo.Selector.mouseup);
  
  chrome.storage.sync.get('selectStatus', function (obj) {
    // Set status to pause on click
    $("#pause").click(function() {
      chrome.storage.sync.set({ 'selectStatus': {"select": "pause", "tab": obj.selectStatus["tab"]} }, function() {
        console.log("SelectGo Setup done.")
      });
      window.close();
    });
    // Remove pause button if already paused.
    if(obj.selectStatus["select"] == "pause"){
      $("#pause").remove();
    }
  });
});

function disablePopup(id){
  window.getSelection().empty();
  $('#'+id).webuiPopover("destroy");
}

