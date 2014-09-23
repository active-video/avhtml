<?php
/**
 * Purpose of this file is to read each of the folders in buttons and assign images to all sizes of buttons
 * this is done to remove dependencies for explicit event listeners for swapping images and to minimize
 * the number of images needed for button sets on this platform (and hence memory consumption) since
 * less DOM nodes == less memory
 * @use load buttons.php in your browser and copy the CSS into buttons.css when the desired
 * files are in the buttons folder
 */

 $str = '/*
	@fileName buttons.php
	@author Chad Wagner
	@fileDescription SAMPLE USAGE - buttons.php?folder=button_folder_name&prefix=AVButton 
*/

';
 
 $prefix = preg_replace('/[^A-Za-z0-9_]/', '', $_GET['prefix'] ? $_GET['folder'] : 'AVB');
 $folder = preg_replace('/[^A-Za-z0-9_]/', '', $_GET['folder'] ? $_GET['folder'] : 'buttons');
 
$focusedStyles = '';
$selectedStyles = '';

 if ($handle = opendir($folder)) {
    while (false !== ($subFolder = readdir($handle))) {
		if(strpos($subFolder, '.') !== false) continue;
		else if(is_dir("$folder/$subFolder") && $subFolderHandle = opendir("$folder/$subFolder")) {
			while (false !== ($imageFile = readdir($subFolderHandle))) {
				if(is_file("$folder/$subFolder/$imageFile") && $imageFile != 'Thumbs.db'){
					
					//for themed images
					$className = $prefix . $subFolder . substr($imageFile,0,strpos($imageFile,'_'));
					//for images representing button states
					$classBase = "AVB" . substr($imageFile,0,strpos($imageFile,'_'));
					
					$imageFilePath = "$folder/$subFolder/$imageFile";
					if(strpos($imageFile, '_f')){
						$focusedStyles .= "\n.$classBase:focus,.{$classBase}_f{background-image: url('$imageFilePath');}";
					}else if(strpos($imageFile,'_s')){
						$selectedStyles .= "\n.$classBase:active,.{$classBase}_s{background-image: url('$imageFilePath');}";
					}else{
						$str .= "\n.$className{background-image: url('$imageFilePath');}";
					}
				}				
			}
		}
    }
    closedir($handle);
	$str = $str . $focusedStyles . $selectedStyles;
	file_put_contents("$folder.css", $str);
}

echo $str;
 
?>