import {UUID} from "../../lib/uuid.js";

export const createRow = r => {
    let s = `
<div class="row list-item">
  <div class="row">
    <div class="column">
      `
    if (r.images) {
        const uuid = UUID.next()
        for (const image of r.images) {
            s += `
      <div><img src="${image.localPath}" alt="${image.alt}" height="50" onclick="overlayImage(this, '${uuid}')"></div>`
        }
        s += `
    </div>
    <div>
      <div><img id="${uuid}" src="${r.images[0].localPath}" alt="${r.images[0].alt}" height="300"></div>
    </div>
  </div>`
    }
    s += ` 
  <div class="column list-item-info">
    <div class="row heading">
      <div class="title">${r.title}</div>
      <div class="distance">${r.store.distance.magnitude}${r.store.distance.units}</div>
    </div>
    <div class="column">
      <div class="row store">
        <div class="name">
          <a target="_blank" href="${r.directionsURL}">${r.store.name}</a>
        </div>
        <div class="rating" data-template="rating" data-source="store.rating">${r.store.rating.score}
        `
    for (let i = 0; i < 5; i++) {
        s += `
          <span class="fas fa-star ${r.store.rating.score > i ? "filled" : ""}"></span>`
    }
    s += `
          <span class="rating-count"><a href="">${r.store.rating.count} store ratings</a></span>
        </div>
        <div class="directions">
          <a target="_blank" href="${r.store.directionsURL}">Directions</a>
        </div>
      </div>
      <div class="row purchase-details">
        <div class="column">
          <div class="price">${r.price.amount}</div>
          <div class="availability">
            Availability
            <ul>
            `
    for (const [key, value] of Object.entries(r.Availability)) {
        s += `
              <li${value ? "" : " class='unavailable'"}>${key}</li>`
    }
    s += `              
            </ul>
          </div>
          `
    if (r.variants) {
        s += `      
          <div class="variants">
            Options<br/>
           `
        s += `   
            <select id="variants" name="variants">
             `
        for (const variant of r.variants) {
            s += `
             <option>${variant}</option>       
                    `
        }
        s += `
            </select>
          </div>
          `
    }
    s += `
        </div>
        <div class="features">
          <div class="description">
            ${r.description}
          </div>
          `
    if (r.specs) {
        s += `
          <div>
            <ul class="specs">`
        for (const spec of r.specs) {
            s += `
              <li>${spec}</li>`
        }
        s += `
            </ul>
          </div>`
    }
    s += `            
      </div>
    </div>    
  </div>
</div>`
    return s
}
