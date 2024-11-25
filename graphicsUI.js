import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Function to create a character sprite from the texture atlas
export function createCharacterSprite(character, texture) {
    console.log("Hola, entro.", character);

    const charWidth = 8; // Width of each character in pixels
    const charHeight = 7; // Height of each character in pixels
    const columns = 16; // Number of columns in the texture atlas
    const rows = 4; // Number of rows in the texture atlas
    const paddingX = 1;
    const paddingY = 2;

    // Calculate the effective width and height of each character including padding
    const effectiveCharWidth = charWidth + paddingX;
    const effectiveCharHeight = charHeight + paddingY;

    // Calculate the index of the character in the texture atlas
    let charCode = character.charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) { // 'A'-'Z'
        charCode -= 65;
    } else if (charCode >= 49 && charCode <= 57) { // '1'-'9'
        charCode = charCode - 23; // Numbers start after the letters - 49 + 26
    } else if (charCode === 48) { // '0'
        charCode = 35; // 0 is after 9
    } else {
        throw new Error('Unsupported character: ' + character);
    }

    const column = charCode % columns;
    const row = Math.floor(charCode / columns);

    // Divides the texture in sections
    texture.repeat.set(1 / columns, 1 / rows);
    texture.repeat.set(charWidth / (columns * effectiveCharWidth), charHeight / (rows * effectiveCharHeight));
    // Picks the correct section
    texture.offset.set(column / columns, 1 - (row + 1) / rows);
    texture.offset.set(
        (column * effectiveCharWidth) / (columns * effectiveCharWidth),
        1 - ((row + 1) * effectiveCharHeight) / (rows * effectiveCharHeight)
    );

    //texture.repeat.set(1, 1);
    //texture.offset.set(0, 0);

    console.log("Character:", character, "Column:", column, "Row:", row, "Offset:", texture.offset, "Repeat:", texture.repeat);
    console.log("Texture Clone:", texture);

    const material = new THREE.SpriteMaterial({ map: texture,
        color: 0xFFFFFF,
        transparent: true,
        opacity: 1
     });
    const sprite = new THREE.Sprite(material);
    console.log("Material:", sprite.material);
    sprite.scale.set(charWidth*5, charHeight*5, 1); // Adjust the scale as needed

    console.log("Character:", character, "Column:", column, "Row:", row, "Offset:", texture.offset, "Repeat:", texture.repeat);
    return sprite;
}