
var tools = document.getElementsByName("tool");
var selected_tool = "line-tool";

function switch_tool(tool_id) {
    document.getElementById(tool_id).checked = true;
    selected_tool = tool_id;
}
