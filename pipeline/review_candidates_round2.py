"""Materialise the individually read second review; no LLM or auto-approval loop."""
import json,re,hashlib
from pathlib import Path
import argparse
parser=argparse.ArgumentParser()
parser.add_argument('--review-source', type=Path, required=True, help='Local frozen candidates_reviewed.json; raw source text stays outside Git')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
source=args.review_source
candidates=json.loads(source.read_text(encoding='utf-8'))
rows=json.loads((root/'data/recipes.json').read_text(encoding='utf-8'))
rows=[r for r in rows if r.get('review',{}).get('release')!='remaining-123']
existing={r['recipe_id'] for r in rows}
blocked={
3:('preparation_review','Raw eggs are blended and frozen without a cooking or pasteurised-egg specification. Requires a separately verified preparation before release.'),
10:('missing_ingredients','Only dressing ingredients are present; pineapple, strawberries, kiwi, bananas, oranges, grapes and blueberries have no quantities.'),
14:('missing_ingredients','Tea bags and their quantity are absent; the directions require another six cups of water not listed in the ingredient block.'),
25:('missing_ingredients','Dressing oil, vinegar, mustard, honey, salt and pepper are absent from the ingredient block.'),
43:('preparation_review','Green beans are used without a specified cooking/preparation stage. Hold until the intended ready-to-eat preparation is verified.'),
46:('missing_ingredients','Only dressing is listed; strawberries, spinach and almonds have no quantities.'),
56:('missing_ingredients','Oil, sugar, both vinegars, sesame, poppy seeds, onion and paprika for dressing are absent.'),
102:('missing_ingredients','Olive oil, lemon juice, Dijon mustard, salt and pepper for the dressing have no quantities.'),
106:('missing_ingredients','Cilantro, lime juice, honey, salt and cayenne used in the dressing are absent.'),
112:('missing_ingredients','Papaya, black beans, corn and red pepper forming the salad are absent.'),
118:('missing_ingredients','White wine vinegar, olive oil and Dijon mustard for dressing are absent.'),
122:('missing_ingredients','Only crust ingredients are present; the cream layer, gelatin layer and fruit quantities are absent.'),
126:('missing_ingredients','Only nut topping is listed; kale, persimmon, pomegranate and dressing quantities are absent.'),
138:('missing_ingredients','Only cream sauce is listed; fruit, granola, raisins and coconut quantities are absent.')}
# Each entry was checked against its complete cached ingredient list and directions.
# The displayed directions are new wording of the preparation facts.
methods={
2:('Cucumber lemon cooler','Heat the sugar with the water until dissolved and almost boiling. Cool the syrup in the refrigerator for about 30 minutes.|Blend the cucumber and leave its pulp in a fine sieve for about 15 minutes, collecting roughly two-thirds of a cup of juice. Mix this with the syrup and lemon juice and serve cold.'),
4:('Layered melon fruit dessert','Cut three thick crosswise watermelon rounds, remove their rinds and arrange them from largest to smallest with the prepared strawberries, cantaloupe and pineapple between layers.|Use remaining fruit to decorate the stack. Refrigerate until serving, then cut into wedges.'),
5:('Lemon water with sugar','Squeeze the lemons to obtain about one cup of juice. Mix it with the measured sugar and water until the sugar dissolves.|Adjust with extra water if required, refrigerate, and pour over ice to serve.'),
6:('Peach milk ice cream','Blend the prepared peaches with the half-and-half and sugar in batches. Combine with condensed milk, evaporated milk and vanilla in the ice-cream container.|Add whole milk up to the container fill line, approximately two cups. Churn according to the machine instructions, about 20 minutes, then freeze in a covered container for about four hours.'),
7:('Watermelon cucumber feta bowl','Leave the sliced onion in the lime juice while preparing the other ingredients.|Combine watermelon, cucumber, feta and coriander. Fold in the onion and its juice, then season with pepper and salt just before serving.'),
9:('Chilled coconut pudding pie','Whisk the instant pudding with milk until thick. Fold in one cup of coconut and half the ready-to-use whipped topping, then spread into the already baked pie shell.|Cover with the remaining topping and coconut. Refrigerate before serving.'),
11:('Cranberry berry fig blend','Put the cranberry juice and all the prepared fruit into a blender.|Process evenly and serve, or keep the drink refrigerated until needed.'),
12:('Passion fruit cream meringue','Heat the oven to 205 C. Grease an eight-inch springform pan and lightly dust with cornstarch.|Whip the egg whites in a grease-free bowl until firm. Gradually beat in the mixed cream of tartar, sugar and cornstarch, then gently fold in the vinegar.|Spread the meringue in the pan with a shallow hollow in the centre. Put it in the oven and immediately reduce the setting to 120 C. Bake for 75–90 minutes, then open the door and leave it inside for another 15 minutes.|Carefully release the pan rim and cool completely before moving to a plate. Whip the cream with vanilla and confectioners sugar, spread over the meringue, top with passion fruit pulp and chill.'),
13:('Chilled mixed fruit coconut bowl','Turn together the watermelon, peach, nectarine, plum, blueberries and grapes. Fold through the coconut and cinnamon.|Cover and refrigerate for at least one hour. Add the optional ready-to-use topping when serving.'),
15:('Banana pineapple cream layers','Mix the cracker crumbs, white sugar and already melted butter, then press into a 9-by-13-inch pan. Chill for about 30 minutes.|Beat cream cheese with confectioners sugar and spread over the base. Add layers of banana, drained pineapple and ready-to-use whipped topping.|Finish with cherries and peanuts. Refrigerate for at least one hour before serving.'),
16:('Mint cucumber watermelon bowl','Leave the onion in lime juice for at least ten minutes, then stir in the olive oil.|Combine the watermelon, cucumbers and feta, add the onion dressing and fold through the mint.'),
17:('Cucumber citrus infused water','Lightly crush the prepared cucumber, nectarine, citrus slices and juices, ginger and lemon balm in a jug. Add water and stevia and stir.|Refrigerate for two hours or overnight to infuse. Strain and pour over ice.'),
18:('Chilled pineapple pastry pie','Heat the oven to 220 C. Stir the sugar, cornstarch, pineapple with its juice and lemon juice over medium heat until thick, then boil for one minute.|Let the filling cool slightly and transfer into the pastry-lined pie pan. Add the top pastry, seal, cut steam vents and brush with milk and the extra sugar.|Bake for 35 minutes. Cool before serving chilled or at room temperature.'),
19:('Mint lemon mixed fruit bowl','Combine the prepared watermelon, strawberries, peaches, nectarines, pear and grapes.|Mix lemon juice, zest, mint and honey, fold through the fruit, and refrigerate for one hour.'),
21:('Fruit cream cheese dessert cups','Beat cream cheese with brown sugar and vanilla and refrigerate for about 30 minutes. Mix the strawberries, pineapple, grapes and blueberries separately.|In each serving cup, layer about three tablespoons of cream mixture, about one-third cup of fruit and one or two teaspoons of cookie crumbs. Add kiwi slices and refrigerate until serving.'),
23:('Avocado milk ice blend','Put the prepared avocado, milk, sugar, ice, lemon juice and vanilla ice cream into a blender.|Process evenly, then divide between glasses.'),
24:('Chilled persimmon baked pudding','Heat the oven to 165 C. Mix buttermilk with baking soda in one bowl, and flour, baking powder, cinnamon and salt in another.|Beat the persimmon pulp, sugar and eggs together. Alternately fold in the wet and dry mixtures, then add cream and the already melted butter.|Pour into a 9-by-13-inch pan and bake for 25–30 minutes, until the edges pull away and the centre begins to crack. Cool and refrigerate before serving.'),
27:('Cherry cream frozen dessert','Stir the cream, milk and sugar until dissolved. Mix in both extracts and the pitted cherries.|Churn using the ice-cream maker instructions, transfer to a freezer container and freeze for at least two hours.'),
28:('Watermelon olive mint salad','Leave the onion in lime juice for ten minutes.|Fold it and the juice through the watermelon, feta, olives and mint, then add the olive oil.'),
30:('Pomegranate cream frozen dessert','Stir the cream and sugar together, then incorporate the juice, vanilla and salt.|Transfer to an ice-cream maker and freeze using its instructions.'),
31:('Spinach walnut pomegranate bowl','Arrange the spinach, walnuts, feta, onion and pomegranate seeds in a bowl.|Drizzle over the vinaigrette just before serving. The source optional alfalfa sprouts are omitted in this version.'),
32:('Watermelon strawberry lemon blend','Put the prepared watermelon and strawberries in a blender with lemon juice, sugar and water.|Blend evenly and pour into glasses.'),
33:('Watermelon cream sherbet','Mix watermelon, sugar, lemon juice and salt and refrigerate for 30 minutes. Blend this mixture evenly.|Sprinkle gelatin onto the cold water in a saucepan, wait one minute, then heat gently for two minutes. Stir into the fruit mixture, add cream and beat until aerated.|Churn according to the ice-cream machine instructions. Transfer to a sealed container and freeze for at least two hours.'),
35:('Strawberry almond protein blend','Blend the strawberries, banana, almonds and water first. Add the ice and process again.|Add the measured protein powder and mix for roughly 30 seconds until incorporated.'),
36:('Watermelon lemon frozen dessert','Heat and stir the sugar, water and lemon juice for about five minutes until dissolved. Refrigerate the syrup for about 30 minutes.|Blend the watermelon, mix with the cooled syrup and freeze in an ice-cream maker according to its instructions.'),
37:('Cherry pineapple gelatin dessert','Measure one cup of the reserved cherry and pineapple juices together. Bring to a boil and whisk in the gelatin mix, then take off the heat and blend in cream cheese.|Beat in the cola, fold in the drained fruit and pecans, transfer to a mould and refrigerate for six to eight hours until set.'),
40:('Strawberry kiwi walnut spinach bowl','Mix raspberry vinegar, jam and oil to make the dressing.|Combine the spinach, walnuts, strawberries and kiwi, then fold through the dressing.'),
41:('Avocado yogurt ice smoothie','Add the milk, prepared avocado, yogurt and honey to a blender.|Add ice, process evenly and pour into a glass.'),
42:('Mango lime frozen dessert','Blend the mango flesh with ready-made simple syrup and lime juice.|Transfer to an ice-cream maker and freeze using the machine instructions.'),
44:('Strawberry peach apple milk blend','Blend the prepared fruit and vanilla ice cream together.|Add ice and milk, process again and serve promptly.'),
45:('Cocoa coconut oat drops','Line a tray with waxed paper and mix the oats with coconut in a bowl.|Heat sugar, cocoa, milk and margarine, stirring until mixed. Bring to a boil and keep stirring for two minutes.|Mix the hot mixture through the oats and coconut, portion by tablespoons onto the tray, and leave to cool and firm.'),
47:('Strawberry vanilla yogurt ice blend','Blend the strawberries with the milk, yogurt, sugar and vanilla.|Add the ice, process until evenly incorporated and divide into glasses.'),
48:('Chilled cocoa peanut oat drops','Heat milk, sugar, butter and cocoa to a rolling boil, stirring frequently. Boil for about one minute.|Take off the heat and mix in oats, coconut, peanut butter and vanilla. Portion onto waxed paper and refrigerate for at least one hour.'),
49:('Chicken egg bacon salad plate','Cover the eggs with cold water in a saucepan, bring to a boil, then cover and remove from the heat. Rest for 10–12 minutes before cooling, peeling and chopping.|Cook the bacon in a skillet for about 7–10 minutes until evenly browned. Drain and crumble.|Arrange lettuce, bacon, egg, already cooked chicken, tomatoes, cheese, onions and avocado on plates. Finish with the dressing.'),
50:('Watermelon lemon iced drink','Blend and sieve the watermelon.|Heat the sugar with half a cup of water until dissolved, about five minutes. Take off the heat and add the remaining cold water and lemon juice.|Distribute ice and a few tablespoons of watermelon puree between glasses, then add the lemon mixture and stir.'),
51:('Refrigerated cherry coconut fruit loaf','Combine the candied cherries, pecans, both milks, coconut, raisins, vanilla and crushed wafers into a stiff mixture.|Press into a pan and refrigerate until ready to portion.'),
52:('Chilled pineapple pasta dessert','Stir pineapple juice, sugar, eggs, flour and half a teaspoon of salt in a saucepan over medium heat until thickened. Take off the heat, add lemon juice and cool for about one hour.|Boil water with the oil and remaining salt, then cook the pasta for 5–7 minutes until al dente. Drain and rinse cold.|Combine the pasta, cooled sauce, drained fruit and topping. Refrigerate for eight hours or overnight, then fold in marshmallows and coconut before serving.'),
54:('Orange pineapple cottage cheese bowl','Mix the drained orange and pineapple with the gelatin powder and refrigerate for 30 minutes.|Stir in cottage cheese, gently fold in the thawed ready-to-use topping and keep chilled until serving.'),
55:('Mango vanilla yogurt ice blend','Measure the milk, yogurt and vanilla into a blender and add the prepared mango.|Add ice and blend to an even consistency.'),
58:('Pear blue cheese pecan salad','Combine the greens, optional onion, pear, candied pecans and blue cheese.|Blend maple syrup, vinegar, mayonnaise, brown sugar, salt and pepper. Gradually add walnut oil while blending, then fold the dressing through the salad.'),
59:('Strawberry banana yogurt juice blend','Put the prepared fruit, yogurt, juices, sugar and milk into a blender.|Process evenly and pour into a glass.'),
60:('Chilled pear lime gelatin dessert','Dissolve the gelatin mix in the measured boiling water. Blend with the pears and cream cheese.|Fold in the thawed topping, transfer to a mould, cover and refrigerate for at least four hours. Briefly warm the outside of the mould with tap water if needed for release.'),
61:('Coconut tropical fruit ice blend','Blend the ice, prepared banana, kiwi, strawberries, pineapple and cream of coconut together.|Pour into a glass and finish with the coconut flakes.'),
62:('Chilled chicken cherry pecan bowl','Use already cooked chicken and toasted pecans. Mix them with the cherries, celery, mayonnaise, buttermilk, salt and pepper, adding the optional apple if wanted.|Refrigerate until chilled and serve as a salad. The source bread accompaniment is omitted.'),
63:('Watermelon milk blend','Blend the watermelon with the milk first.|Add the sugar and process briefly again, then pour into glasses.'),
64:('Chilled apple celery walnut bowl','Mix mayonnaise, sugar, lemon juice and salt in a serving bowl.|Fold through the apples, celery, walnuts and optional raisins. Cover and refrigerate until serving.'),
65:('Banana peanut butter milk smoothie','Put the banana, milk, peanut butter and honey in a blender with the ice.|Blend for approximately 30 seconds until evenly mixed, then serve.'),
66:('Warm beef bean salad','Cook the ground beef following the taco seasoning package preparation instructions.|Combine with lettuce, onions, drained canned beans, tomatoes, avocado and cheese. Add corn chips and dressing immediately before serving.'),
68:('Ready-cooked egg avocado bowl','Break up the already hard-boiled eggs with a fork.|Fold in the avocado, onion, chopped pickles, mustard and mayonnaise. Season with salt and pepper.'),
69:('Banana cinnamon ice milk','Put the ice, milk, banana, sugar and cinnamon in a blender.|Process evenly and pour into a glass.'),
70:('Apple pear cranberry leaf salad','Whisk mustard with vinegar and gradually incorporate the olive oil.|Combine the prepared fruit, cranberries, greens, cheese and walnuts. Fold in the dressing to serve.'),
71:('Mango banana yogurt milk','Put the prepared mango and banana in a blender with vanilla yogurt and milk.|Blend evenly and divide into glasses.'),
72:('Cranberry pineapple gelatin cups','Dissolve the gelatin mix in boiling water, then stir in cranberry sauce and drained pineapple.|Divide into individual dishes or one serving dish, scatter pecans on top and refrigerate until set: about 3–4 hours for small dishes, or four hours to overnight for a large dish.'),
73:('Peach banana yogurt ice blend','Put the yogurt, canned peaches, banana, juice and sugar in a blender.|Add ice and process until evenly blended.'),
75:('Chilled watermelon syrup drink','Blend the watermelon flesh with two cups of cold water and sieve out the pulp.|Heat the sugar with the remaining half cup of water until dissolved, then cool. Stir the syrup into the strained juice to taste.|Refrigerate for at least 30 minutes and serve over ice.'),
76:('Chilled strawberry pretzel layers','Heat the oven to 200 C. Combine crushed pretzels, already melted butter and three tablespoons of sugar, press into a 9-by-13-inch dish and bake for 8–10 minutes. Cool the base.|Beat cream cheese with the remaining sugar, fold in the topping and spread over the base.|Dissolve the gelatin in boiling water and stir in strawberries suitable for this preparation. Once slightly thickened, spread over the cream layer and refrigerate for at least two hours until set.'),
77:('Blueberry pomegranate oat blend','Measure the juice, yogurt, milk, oats, sweetener and cinnamon into a blender, then add the blueberries.|Process until evenly blended, approximately two minutes.'),
78:('Pear pomegranate lettuce with warm dressing','Divide the lettuce, sliced pear and pomegranate seeds between two bowls.|Heat oil, pomegranate juice, lemon juice, mustard, honey and pepper to a boil, then simmer for about two minutes while stirring. Pour over the salad and serve.'),
80:('Spinach rocket orange bowl','Put the washed spinach and rocket into a mixing bowl.|Fold in the sliced onion, drained mandarin oranges and pomegranate seeds.'),
81:('Strawberry peach mixed juice smoothie','Blend the prepared strawberries, peaches and banana first.|Add ice and the mixed fruit juice, then blend again to an even texture.'),
82:('Watermelon rocket tomato feta bowl','Whisk oil, vinegar and salt in a bowl, then turn the tomatoes, rocket and onion through it.|Fold in the prepared watermelon and feta to serve.'),
84:('Mint lime chilled fruit bowl','Combine the prepared watermelon, grapes, cantaloupe, strawberries, kiwi and blueberries in a covered container.|Crush the mint into the sugar and lime juice, pour over the fruit and refrigerate for at least one hour. Gently turn the container before serving.'),
85:('Avocado banana honey milk','Put the milk, avocado flesh, banana and honey into a blender.|Process evenly and pour into glasses.'),
86:('Watermelon spinach rocket feta bowl','Whisk oil, vinegar and salt to make a dressing.|Mix the rocket, spinach, onion and tomatoes with the dressing, then add feta and watermelon.'),
87:('Mango watermelon drink over ice','Blend the prepared watermelon, mango, water and sugar.|Put ice into serving glasses and pour the fruit mixture over it.'),
88:('Tomato pepper avocado salad','Combine the prepared tomatoes, coriander, bell peppers, jalapenos and onions in a bowl.|Gently fold in avocado, lime juice and salt just before serving.'),
90:('Fig rocket pine nut bowl','Combine rocket, prepared figs, Parmesan and already toasted pine nuts.|Drizzle with honey and balsamic vinegar to serve.'),
92:('Chilled watermelon herb feta bowl','Use the already chilled watermelon specified in the ingredients. Combine it with onion, basil, coriander and mint.|Gently fold in lime juice, feta, oil and vinegar, then season with salt and pepper.'),
93:('Mango banana peanut yogurt blend','Put the yogurt, banana, prepared frozen mango and peanut butter in a blender.|Blend evenly and pour into a glass.'),
94:('Pineapple mango papaya banana bowl','Peel, seed or core the fruits as appropriate and cut them into the listed pieces.|Combine gently in a serving bowl.'),
95:('Mango almond whey yogurt blend','Add the mango, yogurt, almond milk, ice and whey powder to a blender.|Add honey if wanted, then process evenly.'),
96:('Tomato watermelon mint bowl','Combine watermelon, tomatoes, feta, onion and mint in a large bowl.|Whisk oil, vinegar, salt and pepper separately, then gently fold the dressing through the salad.'),
99:('Mango banana oat yogurt blend','Put orange juice, prepared frozen mango, banana, yogurt and oats into a blender.|Process evenly and pour into a glass.'),
100:('Chilled coconut orange pineapple dessert','Combine the marshmallows, coconut, drained oranges and pineapple with sour cream.|Cover and refrigerate for five to six hours before serving.'),
103:('Banana avocado spinach ice blend','Put the prepared banana, avocado and washed spinach into a blender.|Add milk, ice, honey and vanilla, then process evenly.'),
105:('Strawberry kiwi grape slush','Put the ice, prepared strawberries and kiwi into a blender with grape juice, water and lemon juice.|Blend to a slushy consistency, approximately 25–35 seconds.'),
107:('Banana cocoa peanut milk blend','Put the bananas, milk, ice, cocoa, peanut butter and vanilla in a blender.|Process evenly and divide between two glasses.'),
108:('Chilled citrus pineapple orzo dessert','Cook orzo in boiling lightly salted water for about 11 minutes until al dente. Drain and combine with the drained fruit and cherries.|Heat the reserved fruit juices, sugar, eggs and flour over low heat, stirring for 5–7 minutes until thick. Cool for about 30 minutes.|Mix the cooled sauce through the pasta and fruit. Refrigerate for eight hours or overnight and fold in the topping before serving.'),
109:('Chilled watermelon lime jug','Blend the watermelon and sugar with one cup of water.|Transfer to a jug, add lime juice and the remaining seven cups of water. Adjust to taste and refrigerate for about one hour.'),
110:('Orange fig blue cheese leaf bowl','Combine the prepared lettuce, orange segments, Gorgonzola and figs.|Add the vinaigrette and gently turn the salad together.'),
113:('Mango pineapple berry yogurt blend','Put the prepared mango and frozen berries into a blender with yogurt and pineapple juice.|Blend evenly and divide into glasses.'),
114:('Green mango lime peanut salad','Combine the prepared mango, onion, red pepper and coriander.|Dissolve the sugar into the lime juice and fish sauce. Fold through the salad and scatter the peanuts over the top.'),
115:('Watermelon cucumber lime cooler','Blend watermelon with one and a half cups of water, then add cucumber, lime juice and sugar. Sieve, pressing gently to extract the liquid.|Stir in the remaining water and refrigerate for at least one hour.|Moisten the glass rim with the lime wedge and dip in the seasoning. Add ice, pour in the drink and garnish with the listed watermelon and lime slices.'),
116:('Watermelon mint blue cheese bowl','Whisk oil, vinegar, salt and pepper separately.|Combine watermelon, onion and mint, then fold through the dressing and blue cheese.'),
119:('Peach mango soy juice blend','Put the prepared peach and mango in a blender.|Add vanilla soy milk and orange juice, then process evenly.'),
120:('Watermelon avocado spinach bowl','Combine the watermelon, spinach and avocado.|Whisk walnut oil, olive oil, lime juice and paprika, then fold through the salad.'),
121:('Papaya strawberry banana ice milk','Put the prepared fruit into a blender with milk and sugar.|Add ice, process evenly and pour into glasses.'),
123:('Strawberry lemon soda ice blend','Combine the strawberries, sugar, chilled soda and lemon juice in a blender.|Add ice and process to an even slush.'),
124:('Chilled pineapple cabbage slaw','Mix the ready-to-use coleslaw vegetables with drained pineapple and onion.|Whisk mayonnaise, vinegar, sugar, coriander, salt and pepper, then fold through the vegetables and refrigerate.'),
125:('Nectarine buttermilk blend','Put the prepared nectarines in a blender with brown sugar and buttermilk.|Process evenly and serve.'),
127:('Papaya mango citrus punch','Blend mango and papaya first.|Add both juices, sugar, zest and water and blend again. Pour over crushed ice.'),
128:('Chilled basil watermelon bowl','Finely slice the basil and combine it with the watermelon and lemon juice.|Mix salt with chili powder, fold through the fruit and refrigerate for at least 30 minutes.'),
129:('Apricot pineapple lime punch','Combine pineapple juice, apricot nectar and frozen limeade concentrate in a punch bowl.|Gently stir in the lemon-lime soda just before serving.'),
130:('Cooled potato pomegranate slaw','Cover the potato cubes with salted water, bring to a boil, then simmer for 5–10 minutes until tender. Drain and cool for about ten minutes.|Combine with cabbage, pomegranate and carrot. Mix the remaining dressing ingredients separately and fold through the salad.'),
131:('Watermelon cucumber lime juice','Feed the prepared watermelon and cucumber through a juicer following its instructions.|Collect the juice in a jug and stir in lime juice.'),
132:('Peach tomato mozzarella plate','Whisk olive oil, vinegar and a pinch of the salt.|Arrange tomato, peach, basil and mozzarella in alternating layers. Add the dressing and remaining salt.'),
133:('Watermelon pineapple coconut milk drink','Use a fork to break the watermelon flesh into small pieces, leaving the rind behind.|Stir in water, pineapple, evaporated milk and coconut, followed by sugar and lime juice.'),
134:('Quinoa broccoli Brazil nut bowl','Bring quinoa, water and bouillon to a boil. Cover and simmer for 25–30 minutes until the grains are expanded.|In a separate pan, boil the broccoli for 5–10 minutes until tender. Drain and rinse both the broccoli and cooked quinoa with cold water.|Combine with onion, Brazil nuts and pomegranate, then add oil, vinegar, honey, salt and pepper.'),
135:('Simple watermelon water blend','Put the prepared watermelon into a blender with water and sugar.|Process evenly and pour into glasses.'),
139:('Cantaloupe milk drink','Put the peeled, seeded melon in a blender with milk and sugar.|Process evenly and divide between glasses.'),
140:('Halloumi mixed bean bowl','Use drained, already cooked beans. Cook the halloumi slabs in a nonstick pan over medium-high heat, turning through the sides, for about five minutes total. Cool slightly and dice.|Whisk vinegar, honey, harissa, oil and pepper. Combine the beans, onion and herbs with the cheese and dressing.|Cover and let the mixture stand for at least 15 minutes before serving.'),
141:('Papaya cinnamon ice milk','Blend the evaporated milk, papaya, sugar, vanilla and cinnamon.|Add ice and process again to a slushy texture.'),
142:('Ready-cooked rice smoked salmon bowl','Mix soy sauce, green onions, sesame oil, vinegar, ginger and garlic. Add the ready-to-eat smoked salmon and refrigerate for 30–60 minutes.|Divide already cooked brown rice into four bowls and top with the salmon, fruit and vegetables. Add sesame seeds to finish.'),
143:('Banana peanut cocoa protein blend','Put the milk, banana, protein powder, peanut butter, honey and cocoa into a blender.|Add ice and process evenly.'),
144:('Pomegranate walnut blue cheese leaves','Combine the salad leaves, pomegranate, blue cheese and walnuts.|Fold in the cranberry vinaigrette just before serving.'),
145:('Hot lemon honey ginger infusion','Put the honey, lemon juice, ginger and cinnamon into a heatproof teapot or jug. Boil the measured water and pour it over them, stirring to dissolve the honey.|Cover for five minutes to infuse, then strain if preferred and pour into mugs.'),
146:('Chilled freekeh tahini nut salad','Dry-toast the freekeh in a saucepan for about three minutes. Add broth, bring to a simmer, cover and cook for about 20 minutes until absorbed. Rest off the heat for five minutes, then transfer to a bowl to cool.|Whisk vinegar, tahini and honey, then gradually add oil and season. Mix the cooked grain with pomegranate, onion and herbs and fold through the dressing.|Refrigerate for 30 minutes and add pistachios just before serving.'),
147:('Warm honey lemon mug','Put water and honey in a microwave-safe mug and heat for 90 seconds.|Stir in the lemon juice and sugar until dissolved.'),
148:('Chilled mango papaya lime bowl','Whisk lime juice, honey, lime zest, vinegar and brown sugar.|Fold the dressing through prepared mango and papaya. Cover and refrigerate for one hour.')}
remaining={i for i,c in enumerate(candidates,1) if c['recipe_id'] not in existing}
assert remaining==set(methods)|set(blocked),(remaining-set(methods)-set(blocked),set(methods)&set(blocked))
# Explicit heating stages: method, [min, central, max], source/assumed, rewritten step index.
heat={
2:[('simmer',[2,5,10],'assumed',0)],
12:[('bake',[5,10,20],'assumed',0),('bake',[75,82.5,90],'source',2),('bake',[15,15,15],'source',2)],
18:[('bake',[5,10,20],'assumed',0),('simmer',[2,5,10],'assumed',0),('boil',[1,1,1],'source',0),('bake',[35,35,35],'source',2)],
24:[('bake',[5,10,20],'assumed',0),('bake',[25,27.5,30],'source',2)],
33:[('simmer',[2,2,2],'source',1)],36:[('simmer',[5,5,5],'source',0)],37:[('boil',[2,5,10],'assumed',0)],
45:[('boil',[2,5,10],'assumed',1),('boil',[2,2,2],'source',1)],48:[('boil',[2,5,10],'assumed',0),('boil',[1,1,1],'source',0)],
49:[('boil',[2,5,10],'assumed',0),('pan_fry',[7,8.5,10],'source',1)],50:[('boil',[5,5,5],'source',1)],
52:[('simmer',[3,8,15],'assumed',0),('boil',[2,5,10],'assumed',1),('boil',[5,6,7],'source',1)],
60:[('boil',[2,5,10],'assumed',0)],66:[('pan_fry',[5,12,20],'assumed',0)],72:[('boil',[2,5,10],'assumed',0)],75:[('simmer',[2,5,10],'assumed',1)],
76:[('bake',[5,10,20],'assumed',0),('bake',[8,9,10],'source',0),('boil',[2,5,10],'assumed',2)],
78:[('boil',[1,3,5],'assumed',1),('simmer',[2,2,2],'source',1)],108:[('boil',[2,5,10],'assumed',0),('boil',[11,11,11],'source',0),('simmer',[5,6,7],'source',1)],
130:[('boil',[2,5,10],'assumed',0),('simmer',[5,7.5,10],'source',0)],
134:[('boil',[2,5,10],'assumed',0),('simmer',[25,27.5,30],'source',0),('boil',[2,5,10],'assumed',1),('boil',[5,7.5,10],'source',1)],
140:[('pan_fry',[5,5,5],'source',0)],145:[('boil',[2,5,10],'assumed',0)],
146:[('dry_toast',[3,3,3],'source',0),('simmer',[1,3,5],'assumed',0),('simmer',[20,20,20],'source',0)],147:[('microwave',[1.5,1.5,1.5],'source',0)]}
wait={2:30,6:240,13:60,15:90,16:10,17:120,19:60,21:30,27:120,28:10,33:150,36:30,37:360,48:60,49:10,52:540,54:30,60:240,72:180,75:30,76:120,84:60,100:300,108:510,109:60,115:60,128:30,130:10,140:15,142:30,145:5,146:35,148:60}
noheat_prepared={9:'The pie shell must already be baked and the topping ready to use.',15:'Butter is accepted already melted; melting it yourself adds heating.',24:'Butter is accepted already melted; melting it yourself adds heating.',42:'Simple syrup is accepted ready-made; making it yourself adds heating.',62:'Chicken must already be cooked and pecans already toasted.',68:'Eggs must already be hard-boiled.',76:'Butter is accepted already melted; melting it yourself adds heating.',90:'Pine nuts are accepted already toasted.',140:'Beans must be ready-to-eat cooked or canned beans, not dried/raw beans.',142:'Uses ready-to-eat smoked salmon and already cooked rice; preparing rice adds heating.'}
icecream={6,27,30,33,36,42}
round2=[]
for n,(title,prose) in sorted(methods.items()):
 c=candidates[n-1]; text=c['ingredients_raw']; steps=prose.split('|')
 # Factual ingredient lists only; split quantity-led boundaries, not descriptor commas.
 pieces=re.split(r',\s*(?=(?:\d|[½¼¾⅓⅔⅛⅜⅝⅞]|salt and|ground black pepper|cracked black pepper|sea salt|ice as needed))',text)
 pieces=[re.sub(r'\s+',' ',s).strip().rstrip(',') for s in pieces if s.strip()]
 equipment=[];changes=[]
 if n==21:
  pieces=[s for s in pieces if 'plastic' not in s]; equipment=['25 serving cups, approximately 10 ounces each'];changes.append('Serving cups moved out of ingredients into equipment.')
 if n==31:pieces=[s for s in pieces if 'alfalfa' not in s];changes.append('Optional alfalfa sprouts omitted; retained ingredients unchanged.')
 if n==23:pieces=[s.replace('lemon or lime juice','lemon juice') for s in pieces];changes.append('Selected listed lemon option.')
 if n==140:
  pieces=[re.sub(r'(black beans|kidney beans|white beans)',r'cooked or canned \1',s) for s in pieces];changes.append('Made ready-to-eat bean state explicit from drained/rinsed preparation.')
 if n==62:changes.append('Omitted unquantified bread accompaniment; salad served on its own. Used listed buttermilk rather than generic milk in source directions.')
 if n==12:changes.append('Used listed passion fruit only; omitted unquantified optional kiwi alternative.')
 if n in {5,75,127}:pieces.append('Ice, for serving');changes.append('Serving ice added from source directions.')
 if n in icecream:equipment.append('Ice-cream maker')
 # Conservative ingredient-screening families, individually reviewed for this batch.
 patterns={'milk':r'\b(milk|cream|cheese|feta|yogurt|yoghurt|buttermilk|butter|half-and-half|halloumi|gorgonzola|mozzarella|parmesan|whey)\b',
 'egg':r'\b(eggs?|mayonnaise)\b','wheat':r'\b(flour|pastry|pie shell|cracker|crackers|cookies|pretzels|wafers|pasta|orzo|freekeh|soy sauce)\b',
 'soy':r'\b(soy|soya)\b','sesame':r'\b(sesame|tahini)\b','fish':r'\b(fish sauce|salmon)\b',
 'peanut':r'\bpeanuts?\b','almond':r'\balmonds?\b','walnut':r'\bwalnuts?\b','pecan':r'\bpecans?\b','pine_nut':r'\bpine nuts?\b',
 'brazil_nut':r'\bbrazil nuts?\b','pistachio':r'\bpistachios?\b','oats':r'\boats?\b','mustard':r'\bmustard\b'}
 screen=' '.join(pieces).lower(); dairy=re.sub(r'(?:soy|soya|almond|coconut) milk|cream of coconut|peanut butter|cream of tartar|nondairy whipped topping','',screen)
 allergens=[k for k,p in patterns.items() if re.search(p,dairy if k=='milk' else screen)]
 compound_words=['pudding mix','whipped topping','pie shell','pastry','protein powder','whey','mayonnaise','vinaigrette','dressing','seasoning','gelatin','jell-o','margarine','soy sauce','soy milk','vanilla soy','almond milk','bouillon','broth','harissa','cookies','wafers','pretzels','cracker','vanilla yogurt','ice cream','soda','carbonated','cream of coconut','simple syrup','limeade','nectar','juice','extract','jam','pickles','sweetener']
 compounds=[s for s in pieces if any(w in s.lower() for w in compound_words)]
 temp=c['product_temperature'] or ('cold' if n in {92} else 'room')
 detail='warm' if n==66 else temp
 notes=[]
 if n in wait:notes.append(f'Includes at least {wait[n]} minutes of listed waiting/chilling/resting; not an instant meal. Other unquantified waiting may be needed.')
 if n in noheat_prepared:notes.append(noheat_prepared[n])
 if n in icecream:notes.append('Requires an ice-cream maker and freezing time; zero stovetop heating does not mean ready immediately.')
 if 'frozen' in screen:notes.append('Frozen ingredients must be suitable for the listed preparation. Follow package preparation instructions.')
 if n in {52,108}:notes.append('The egg-containing sauce must be cooked as directed before cooling; timing estimates are ranking metadata, not doneness checks.')
 stage_rows=[]
 for j,(method,minutes,basis,index) in enumerate(heat.get(n,[])):
  stage_rows.append(dict(id=f'{c["recipe_id"]}-heat-{j+1}',method=method,minutes=minutes,basis=basis,evidence=[dict(step_index=index,text=steps[index])],note='Source-listed active duration.' if basis=='source' else 'Active heating/warm-up duration absent; ranking scenario only, not cooking instructions.'))
 r=dict(recipe_id=c['recipe_id'],title=title,standard_recipe_label=title+' · Reviewed preparation',dataset_version='ingredient-review-2',cuisine_id=c['cuisine_id'] or 'international',cuisine_label=(c['cuisine_id'] or 'international').replace('_',' ').title(),source_language='en',display_language='en',dish_type=c['dish_type'],dish_type_label={'beverage':'Drink','salad':'Salad','dessert':'Dessert'}[c['dish_type']],standalone_dish=True,
 ingredients=[dict(text=t,source_index=i,changed=True) for i,t in enumerate(pieces)],steps=[dict(text=t,source_index=i,changed=True) for i,t in enumerate(steps)],product_temperature=temp,serving_temperature_detail=detail,temperature_label={'cold':'Cold / chilled','room':'Room temperature','hot':'Hot'}[temp] if n!=66 else 'Warm',eligible_for_product_prototype=True,
 allergen_ids=allergens,allergen_labels=allergens,allergen_reminder='Check ingredient and compound-product labels and possible cross-contact. Ingredient screening is not an allergy-safety guarantee.',unresolved_compound_ingredients=compounds,allergen_verification_status='assistant_ingredient_screening_product_labels_unverified',food_notes=notes,equipment=equipment,minimum_listed_wait_minutes=wait.get(n),
 heating_methods=list(dict.fromkeys(s['method'] for s in stage_rows)),heat_level=0,heat_breakdown=[],cooking_heat_profile=dict(version='cooking-heat-v2',coverage='listed_preparation',no_active_heat_confirmed=not stage_rows,stages=stage_rows,annotation_method='individual_cached_source_review_with_explicit_timing_assumptions'),
 source=dict(source_url=c['source_url'],revision_url=c['source_url'],source_rows=c['source_rows'],dataset_url=c['licence']['dataset_url']),licence=dict(id='source-rights-not-relicensed',attribution='Preparation facts: Allrecipes via Kaggle. Display title and directions newly worded for HeatPlan.',changes='Factual quantities retained; new display wording and review labels. Upstream prose and images are not redistributed or relicensed.'),
 review=dict(date='2026-10-01',release='remaining-123',candidate_number=n,method='assistant_read_cached_ingredients_and_full_steps',ingredient_alignment='complete_with_recorded_variant_choices',changes=changes,not_claimed=['live_page_verification','kitchen_test','clinical_validation'],temperature_basis='Prior explicit user/product decision retained' if c['product_temperature'] else ('Chilled watermelon is explicitly listed' if n==92 else 'No explicit final heating/chilling; room-temperature default, not a measured temperature'),source_snapshot_sha256='96447a0bafb1d0bceccefc1e8e3ab22927cb83b0398eb281d2b9efb60f720cd5'))
 r['original_title']=c['title']
 allowed={'vietnamese','italian','english','indian','chinese','malaysian','greek','international'}
 if r['cuisine_id'] not in allowed:
  r['source_cuisine_hint']=r['cuisine_id'];r['cuisine_id']='international';r['cuisine_label']='International'
 r['ingredient_state_ids']={62:['cooked_chicken'],68:['hard_boiled_egg'],142:['cooked_rice','smoked_salmon'],66:['pinto_bean','kidney_bean'],140:['black_bean','kidney_bean','white_bean']}.get(n,[])
 w={'boil':1,'simmer':1,'bake':3,'pan_fry':2,'dry_toast':2,'microwave':1,'steam':1}
 r['heat_level']=sum(w[m] for m in r['heating_methods'])
 r['heat_breakdown']=[dict(method=m,weight=w[m],label=m.replace('_',' ')+' +'+str(w[m])) for m in r['heating_methods']]
 r['cooking_heat_profile']['legacy_fields']='heat_level and heat_breakdown are method-only compatibility values; ranking uses the duration-based profile.'
 rows.append(r);round2.append(r)
ledger=json.loads((root/'data/candidate_release_review.json').read_text(encoding='utf-8'))
for entry in ledger:
 n=entry['number']
 if n in blocked:entry.update(status='held_after_review',review_date='2026-10-01',reason_code=blocked[n][0],reason=blocked[n][1])
 elif n in methods:entry.update(status='added_reviewed_preparation',review_date='2026-10-01',reason='Ingredient/preparation alignment reviewed; serving temperature, allergen screening and separate heating stages recorded. See recipe review metadata.')
assert len(rows)==len({r['recipe_id'] for r in rows})
(root/'data/recipes.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
(root/'data/candidate_release_review.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
(root/'data/review_round2_summary.json').write_text(json.dumps(dict(reviewed_remaining=len(remaining),added=len(round2),held=len(blocked),active_total=len(rows),added_ids=[r['recipe_id'] for r in round2],source_review_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),held_candidates=[dict(number=n,reason_code=v[0],reason=v[1]) for n,v in blocked.items()]),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Reviewed',len(remaining),'added',len(round2),'held',len(blocked),'total',len(rows))
