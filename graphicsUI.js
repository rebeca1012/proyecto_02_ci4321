import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Function to create a character sprite from the texture atlas
export function createCharacterSprite(character, texture) {
    console.log("Hola, entro.", character);

    // Clone the texture to prevent sharing UV modifications between sprites
    const spriteTexture = texture.clone()
    spriteTexture.needsUpdate = true

    const charWidth = 8; // Width of each character in pixels
    const charHeight = 7; // Height of each character in pixels
    const columns = 16; // Number of columns in the texture atlas
    const rows = 4; // Number of rows in the texture atlas
    const paddingX = 1;
    const paddingY = 2;

    // Calculate the effective width and height of each character including padding
    const totalCharWidth = charWidth + paddingX;
    const totalCharHeight = charHeight + paddingY;

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

    // Calculate UV coordinates
    // We add a small offset (0.001) to prevent texture bleeding
    const u = column / columns + 0.001
    const v = 1 - ((row + 1) * totalCharHeight) / (rows * totalCharHeight)
    const w = totalCharWidth / (columns * totalCharWidth)
    const h = charHeight / (rows * totalCharHeight)

    // Divides the texture in sections
    // Picks the correct section
    spriteTexture.offset.set(u, v);
    //texture.repeat.set(1 / columns, 1 / rows);
    spriteTexture.repeat.set(w, h);
    

    //texture.repeat.set(1, 1);
    //texture.offset.set(0, 0);

    console.log("Character:", character, "Column:", column, "Row:", row, "Offset:", texture.offset, "Repeat:", texture.repeat);
    console.log("Texture Clone:", texture);

    const material = new THREE.SpriteMaterial({ 
        map: spriteTexture,
        transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    console.log("Material:", sprite.material);
    sprite.scale.set(charWidth*5, charHeight*10, 1); // Adjust the scale as needed

    console.log("Character:", character, "Column:", column, "Row:", row, "Offset:", texture.offset, "Repeat:", texture.repeat);
    return sprite;
}